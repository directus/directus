/**
 * TUS Amazon S3 storage implementation for resumable uploads
 *
 * https://tus.io/
 */
import AWS, { S3, type S3ClientConfig } from '@aws-sdk/client-s3';
import { TusDataStore, type TusDataStoreConfig } from '@directus/tus-driver';
import type { File } from '@directus/types';
import { normalizePath } from '@directus/utils';

import { Permit, Semaphore } from '@shopify/semaphore';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { ERRORS, StreamSplitter, TUS_RESUMABLE, Upload } from '@tus/utils';

import fs, { promises as fsProm } from 'node:fs';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import os from 'node:os';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import stream, { promises as streamProm } from 'node:stream';

export type MetadataValue = {
	file: Upload;
	'upload-id': string;
	'tus-version': string;
};

// Implementation based on https://github.com/tus/tus-node-server
export class S3FileStore extends TusDataStore {
	private bucket: string;
	private root: string;
	private client: S3;
	private useTags = true;
	private partUploadSemaphore: Semaphore;
	private preferredPartSize: number;
	public maxMultipartParts = 10_000 as const;
	public minPartSize = 5_242_880 as const; // 5MiB
	public maxUploadSize = 5_497_558_138_880 as const; // 5TiB

	constructor(config: TusDataStoreConfig) {
		super(config);
		/*
		 * AWS' client default socket reusing can cause performance issues when using it very
		 * often in rapid succession, hitting the maxSockets limit of 50.
		 * The requestHandler is customized to get around this.
		 */
		const connectionTimeout = 5000;
		const socketTimeout = 120000;
		const maxSockets = 500;
		const keepAlive = true;

		const s3ClientConfig: S3ClientConfig = {
			requestHandler: new NodeHttpHandler({
				connectionTimeout,
				socketTimeout,
				httpAgent: new HttpAgent({ maxSockets, keepAlive }),
				httpsAgent: new HttpsAgent({ maxSockets, keepAlive }),
			}),
		};

		const { bucket, key, secret, endpoint, region, forcePathStyle, root } = config.options;

		if ((!secret && key) || (!key && secret)) {
			throw new Error('Both `key` and `secret` are required when defined');
		}

		if (key && typeof key === 'string' && secret && typeof secret === 'string') {
			s3ClientConfig.credentials = {
				accessKeyId: key,
				secretAccessKey: secret,
			};
		}

		if (endpoint && typeof endpoint === 'string') {
			const protocol = endpoint.startsWith('http://') ? 'http:' : 'https:';
			const hostname = endpoint.replace('https://', '').replace('http://', '');

			s3ClientConfig.endpoint = {
				hostname,
				protocol,
				path: '/',
			};
		}

		if (region && typeof region === 'string') {
			s3ClientConfig.region = region;
		}

		if (typeof forcePathStyle === 'boolean') {
			s3ClientConfig.forcePathStyle = forcePathStyle;
		}

		this.extensions = ['creation', 'termination', 'expiration'];

		this.root = (root ?? '') as string;
		this.bucket = bucket as string;
		this.preferredPartSize = config.constants.CHUNK_SIZE;
		this.client = new S3(s3ClientConfig);
		this.partUploadSemaphore = new Semaphore(60);
	}

	private key(file: Pick<File, 'filename_disk'>) {
		return normalizePath(join(this.root, file.filename_disk));
	}

	protected shouldUseExpirationTags() {
		return this.expirationTime !== 0 && this.useTags;
	}

	protected useCompleteTag(value: 'true' | 'false') {
		if (!this.shouldUseExpirationTags()) {
			return undefined;
		}

		return `Tus-Completed=${value}`;
	}

	private async uploadPart(
		file: File,
		metadata: MetadataValue,
		readStream: fs.ReadStream | Readable,
		partNumber: number,
	): Promise<string> {
		const data = await this.client.uploadPart({
			Bucket: this.bucket,
			Key: this.key(file),
			UploadId: metadata['upload-id'],
			PartNumber: partNumber,
			Body: readStream,
		});

		this.logger.trace(`[${metadata.file.id}] finished uploading part #${partNumber}`);
		return data.ETag as string;
	}

	private async uploadParts(
		file: File,
		metadata: MetadataValue,
		readStream: stream.Readable,
		currentPartNumber: number,
		offset: number,
	): Promise<number> {
		const size = file.filesize;
		const promises: Promise<void>[] = [];
		let pendingChunkFilepath: string | null = null;
		let bytesUploaded = 0;
		let permit: Permit | undefined = undefined;

		const splitterStream = new StreamSplitter({
			chunkSize: this.calcOptimalPartSize(size),
			directory: os.tmpdir(),
		})
			.on('beforeChunkStarted', async () => {
				permit = await this.partUploadSemaphore.acquire();
			})
			.on('chunkStarted', (filepath) => {
				pendingChunkFilepath = filepath;
			})
			.on('chunkFinished', ({ path, size: partSize }) => {
				pendingChunkFilepath = null;

				const partNumber = currentPartNumber++;
				const acquiredPermit = permit;

				offset += partSize;

				const isFinalPart = size === offset;

				// eslint-disable-next-line no-async-promise-executor
				const deferred = new Promise<void>(async (resolve, reject) => {
					try {
						// Only the first chunk of each PATCH request can prepend
						// an incomplete part (last chunk) from the previous request.
						const readable = fs.createReadStream(path);
						readable.on('error', reject);

						if (partSize >= this.minPartSize || isFinalPart) {
							await this.uploadPart(file, metadata, readable, partNumber);
						} else {
							// This can happen if the upload is aborted by the user mid chunk or a network issue happens
							// TODO throw error
						}

						bytesUploaded += partSize;
						resolve();
					} catch (error) {
						reject(error);
					} finally {
						fsProm.rm(path).catch(() => {
							/* ignore */
						});

						acquiredPermit?.release();
					}
				});

				promises.push(deferred);
			})
			.on('chunkError', () => {
				permit?.release();
			});

		try {
			await streamProm.pipeline(readStream, splitterStream);
		} catch (error) {
			if (pendingChunkFilepath !== null) {
				try {
					await fsProm.rm(pendingChunkFilepath);
				} catch {
					this.logger.error(`[${metadata.file.id}] failed to remove chunk ${pendingChunkFilepath}`);
				}
			}

			promises.push(Promise.reject(error));
		} finally {
			await Promise.all(promises);
		}

		return bytesUploaded;
	}

	private async finishMultipartUpload(file: File, metadata: MetadataValue, parts: Array<AWS.Part>) {
		const response = await this.client.completeMultipartUpload({
			Bucket: this.bucket,
			Key: this.key(file),
			UploadId: metadata['upload-id'],
			MultipartUpload: {
				Parts: parts.map((part) => {
					return {
						ETag: part.ETag,
						PartNumber: part.PartNumber,
					} as AWS.CompletedPart;
				}),
			},
		});

		return response.Location;
	}

	private async retrieveParts(file: File, partNumberMarker?: string): Promise<Array<AWS.Part>> {
		const uploadId = file.tus_data!['metadata']['upload-id'] as string;

		const params: AWS.ListPartsCommandInput = {
			Bucket: this.bucket,
			Key: this.key(file),
			UploadId: uploadId,
			PartNumberMarker: partNumberMarker!,
		};

		const data = await this.client.listParts(params);

		let parts = data.Parts ?? [];

		if (data.IsTruncated) {
			const rest = await this.retrieveParts(file, data.NextPartNumberMarker);
			parts = [...parts, ...rest];
		}

		if (!partNumberMarker) {
			parts.sort((a, b) => a.PartNumber! - b.PartNumber!);
		}

		return parts;
	}

	private calcOptimalPartSize(size?: number): number {
		// When upload size is not know we assume largest possible value (`maxUploadSize`)
		if (size === undefined) {
			size = this.maxUploadSize;
		}

		let optimalPartSize: number;

		// When upload is smaller or equal to PreferredPartSize, we upload in just one part.
		if (size <= this.preferredPartSize) {
			optimalPartSize = size;
		}
		// Does the upload fit in MaxMultipartParts parts or less with PreferredPartSize.
		else if (size <= this.preferredPartSize * this.maxMultipartParts) {
			optimalPartSize = this.preferredPartSize;
			// The upload is too big for the preferred size.
			// We divide the size with the max amount of parts and round it up.
		} else {
			optimalPartSize = Math.ceil(size / this.maxMultipartParts);
		}

		return optimalPartSize;
	}

	public override async create(upload: Upload) {
		await super.create(upload);

		const fileData = await this.getFileById(upload.id);

		const request: AWS.CreateMultipartUploadCommandInput = {
			Bucket: this.bucket,
			Key: this.key(fileData),
			Metadata: { 'tus-version': TUS_RESUMABLE },
		};

		if (upload.metadata?.['contentType']) {
			request.ContentType = upload.metadata['contentType'];
		}

		if (upload.metadata?.['cacheControl']) {
			request.CacheControl = upload.metadata['cacheControl'];
		}

		try {
			const res = await this.client.createMultipartUpload(request);

			// @ts-expect-error
			upload.metadata['upload-id'] = res.UploadId!;

			await this.getService().updateOne(fileData.id, {
				tus_data: upload,
			});

			return upload;
		} catch (error) {
			// Clean up created file
			await this.getService().deleteOne(fileData.id);

			throw error;
		}
	}

	public override async write(src: stream.Readable, id: string, offset: number): Promise<number> {
		const fileData = await this.getFileById(id);
		const data = new Upload(fileData.tus_data as any);

		const metadata = {
			file: data,
			'upload-id': data.metadata!['upload-id']!,
			'tus-version': TUS_RESUMABLE,
		};

		const parts = await this.retrieveParts(fileData);
		// @ts-expect-error
		const partNumber: number = parts.length > 0 ? parts[parts.length - 1].PartNumber! : 0;
		const nextPartNumber = partNumber + 1;
		const requestedOffset = offset;

		const bytesUploaded = await this.uploadParts(fileData, metadata, src, nextPartNumber, offset);
		const newOffset = requestedOffset + bytesUploaded;

		if (data.size === newOffset) {
			try {
				const parts = await this.retrieveParts(fileData);
				await this.finishMultipartUpload(fileData, metadata, parts);
			} catch (error) {
				this.logger.error(`[${id}] failed to finish upload`, error);
				throw error;
			}
		}

		await this.getSudoService().updateOne(fileData.id, {
			tus_data: {
				...fileData.tus_data,
				offset: newOffset,
			},
		});

		return newOffset;
	}

	public override async getUpload(id: string): Promise<Upload> {
		const fileData = await this.getFileById(id);

		return new Upload(fileData.tus_data as any);
	}

	override async remove(tus_id: string): Promise<void> {
		const file = await this.getFileById(tus_id);
		const key = this.key(file);

		await this.getService().deleteOne(file.id);

		try {
			// @ts-expect-error
			const { 'upload-id': uploadId } = file.tus_data.metadata;

			if (uploadId) {
				await this.client.abortMultipartUpload({
					Bucket: this.bucket,
					Key: key,
					UploadId: uploadId,
				});
			}
		} catch (error: any) {
			if (error?.code && ['NotFound', 'NoSuchKey', 'NoSuchUpload'].includes(error.Code)) {
				this.logger.trace(`[${tus_id}: No file found.`, error);
				throw ERRORS.FILE_NOT_FOUND;
			}

			throw error;
		}

		await this.client.deleteObjects({
			Bucket: this.bucket,
			Delete: {
				Objects: [{ Key: key }],
			},
		});
	}

	protected getExpirationDate(created_at: string) {
		const date = new Date(created_at);

		return new Date(date.getTime() + this.getExpiration());
	}
}

export default S3FileStore;
