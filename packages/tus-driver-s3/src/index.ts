/**
 * TUS Amazon S3 storage implementation for resumable uploads
 *
 * https://tus.io/
 */
import os from 'node:os';
import fs, { promises as fsProm } from 'node:fs';
import stream, { promises as streamProm } from 'node:stream';
import type { Readable } from 'node:stream';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { TusDataStore, type TusDataStoreConfig } from '@directus/tus-driver';
import type { File } from '@directus/types';
import formatTitle from '@directus/format-title';

import AWS, { S3, type S3ClientConfig } from '@aws-sdk/client-s3';

import { StreamSplitter, Upload, TUS_RESUMABLE } from '@tus/utils';

import { Semaphore, Permit } from '@shopify/semaphore';

export type MetadataValue = {
	file: Upload;
	'upload-id': string;
	'tus-version': string;
};

// Implementation (based on https://github.com/tus/tusd/blob/master/s3store/s3store.go)
//
// Once a new tus upload is initiated, multiple objects in S3 are created:
//
// First of all, a new info object is stored which contains (as Metadata) a JSON-encoded
// blob of general information about the upload including its size and meta data.
// This kind of objects have the suffix ".info" in their key.
//
// In addition a new multipart upload
// (http://docs.aws.amazon.com/AmazonS3/latest/dev/uploadobjusingmpu.html) is
// created. Whenever a new chunk is uploaded to tus-node-server using a PATCH request, a
// new part is pushed to the multipart upload on S3.
//
// If meta data is associated with the upload during creation, it will be added
// to the multipart upload and after finishing it, the meta data will be passed
// to the final object. However, the metadata which will be attached to the
// final object can only contain ASCII characters and every non-ASCII character
// will be replaced by a question mark (for example, "Menü" will be "Men?").
// However, this does not apply for the metadata returned by the `_getMetadata`
// function since it relies on the info object for reading the metadata.
// Therefore, HEAD responses will always contain the unchanged metadata, Base64-
// encoded, even if it contains non-ASCII characters.
//
// Once the upload is finished, the multipart upload is completed, resulting in
// the entire file being stored in the bucket. The info object, containing
// meta data is not deleted.
//
// Considerations
//
// In order to support tus' principle of resumable upload, S3's Multipart-Uploads
// are internally used.
// For each incoming PATCH request (a call to `write`), a new part is uploaded
// to S3.
export class S3FileStore extends TusDataStore {
	private bucket: string;
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

		const { bucket, key, secret, endpoint, region, forcePathStyle } = config.options;

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

		this.bucket = bucket as string;
		this.preferredPartSize = config.constants.CHUNK_SIZE;
		this.client = new S3(s3ClientConfig);
		// TODO do we need this?
		this.partUploadSemaphore = new Semaphore(60);
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
		metadata: MetadataValue,
		readStream: fs.ReadStream | Readable,
		partNumber: number,
	): Promise<string> {
		const data = await this.client.uploadPart({
			Bucket: this.bucket,
			Key: metadata.file.id,
			UploadId: metadata['upload-id'],
			PartNumber: partNumber,
			Body: readStream,
		});

		this.logger.trace(`[${metadata.file.id}] finished uploading part #${partNumber}`);
		return data.ETag as string;
	}

	/**
	 * Uploads a stream to s3 using multiple parts
	 */
	private async uploadParts(
		metadata: MetadataValue,
		readStream: stream.Readable,
		currentPartNumber: number,
		offset: number,
	): Promise<number> {
		const size = metadata.file.size;
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
							await this.uploadPart(metadata, readable, partNumber);
						} else {
							// eslint-disable-next-line no-console
							console.error('incomplete part?');
							// await this.uploadIncompletePart(metadata.file.id, readable);
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

	/**
	 * Completes a multipart upload on S3.
	 * This is where S3 concatenates all the uploaded parts.
	 */
	private async finishMultipartUpload(metadata: MetadataValue, parts: Array<AWS.Part>) {
		const response = await this.client.completeMultipartUpload({
			Bucket: this.bucket,
			Key: metadata.file.id,
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

	/**
	 * Gets the number of complete parts/chunks already uploaded to S3.
	 * Retrieves only consecutive parts.
	 */
	private async retrieveParts(id: string, partNumberMarker?: string): Promise<Array<AWS.Part>> {
		const fileData = await this.getFileById(id);
		const uploadId = fileData.tus_data!['metadata']['upload-id'] as string;

		const params: AWS.ListPartsCommandInput = {
			Bucket: this.bucket,
			Key: id,
			UploadId: uploadId,
			PartNumberMarker: partNumberMarker!,
		};

		const data = await this.client.listParts(params);

		let parts = data.Parts ?? [];

		if (data.IsTruncated) {
			const rest = await this.retrieveParts(id, data.NextPartNumberMarker);
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
			// We devide the size with the max amount of parts and round it up.
		} else {
			optimalPartSize = Math.ceil(size / this.maxMultipartParts);
		}

		return optimalPartSize;
	}

	/**
	 * Creates a multipart upload on S3 attaching any metadata to it.
	 * Also, a `${file_id}.info` file is created which holds some information
	 * about the upload itself like: `upload-id`, `upload-length`, etc.
	 */
	public override async create(upload: Upload) {
		upload.metadata = upload.metadata ?? {};
		const fileName = upload.metadata['filename']!;
		const fileType = upload.metadata['filetype'] ?? 'application/octet-stream';



		const request: AWS.CreateMultipartUploadCommandInput = {
			Bucket: this.bucket,
			Key: upload.id,
			Metadata: { 'tus-version': TUS_RESUMABLE },
		};

		if (upload.metadata?.['contentType']) {
			request.ContentType = upload.metadata['contentType'];
		}

		if (upload.metadata?.['cacheControl']) {
			request.CacheControl = upload.metadata['cacheControl'];
		}

		const res = await this.client.createMultipartUpload(request);

		upload.metadata['upload-id'] = res.UploadId!;

		// @ts-expect-error
		upload.storage = { type: 's3', path: res.Key as string, bucket: this.bucket };

		const fileData: Partial<File> = {
			tus_id: upload.id,
			tus_data: upload,
			type: fileType,
			filesize: upload.size!,
			filename_download: fileName,
			title: formatTitle(fileName),
			storage: 'local',
		};

		upload.creation_date = new Date().toISOString();

		await this.getService().createOne(fileData);

		return upload;
	}

	/**
	 * Write to the file, starting at the provided offset
	 */
	public override async write(src: stream.Readable, id: string, offset: number): Promise<number> {
		const fileData = await this.getFileById(id);
		const data = new Upload(fileData.tus_data as any);

		const metadata = {
			file: data,
			'upload-id': data.metadata!['upload-id']!,
			'tus-version': TUS_RESUMABLE,
		};

		// Metadata request needs to happen first
		// const metadata = await this.getMetadata(id);
		const parts = await this.retrieveParts(id);
		// @ts-expect-error
		const partNumber: number = parts.length > 0 ? parts[parts.length - 1].PartNumber! : 0;
		const nextPartNumber = partNumber + 1;
		const requestedOffset = offset;

		const bytesUploaded = await this.uploadParts(metadata, src, nextPartNumber, offset);

		// The size of the incomplete part should not be counted, because the
		// process of the incomplete part should be fully transparent to the user.
		const newOffset = requestedOffset + bytesUploaded;

		if (data.size === newOffset) {
			try {
				const parts = await this.retrieveParts(id);
				await this.finishMultipartUpload(metadata, parts);
				// await this.completeMetadata(metadata.file);
			} catch (error) {
				this.logger.error(`[${id}] failed to finish upload`, error);
				throw error;
			}
		}

		await this.getService().updateOne(fileData.id, {
			tus_data: {
				...fileData.tus_data,
				offset,
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

		await this.getService().deleteOne(file.id);
	}

	protected getExpirationDate(created_at: string) {
		const date = new Date(created_at);

		return new Date(date.getTime() + this.getExpiration());
	}
}

export default S3FileStore;
