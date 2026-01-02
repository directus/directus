import type {
	CompletedPart,
	CopyObjectCommandInput,
	CreateMultipartUploadCommandInput,
	GetObjectCommandInput,
	ListObjectsV2CommandInput,
	ObjectCannedACL,
	Part,
	PutObjectCommandInput,
	S3ClientConfig,
} from '@aws-sdk/client-s3';
import {
	AbortMultipartUploadCommand,
	CompleteMultipartUploadCommand,
	CopyObjectCommand,
	CreateMultipartUploadCommand,
	DeleteObjectCommand,
	DeleteObjectsCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	ListPartsCommand,
	S3Client,
	ServerSideEncryption,
	UploadPartCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { TusDriver } from '@directus/storage';
import type { ChunkedUploadContext, ReadOptions } from '@directus/types';
import { normalizePath } from '@directus/utils';
import { isReadableStream } from '@directus/utils/node';
import { Permit, Semaphore } from '@shopify/semaphore';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { ERRORS, StreamSplitter, TUS_RESUMABLE } from '@tus/utils';
import ms, { type StringValue } from 'ms';
import fs, { promises as fsProm } from 'node:fs';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import os from 'node:os';
import { join } from 'node:path';
import stream, { promises as streamProm, type Readable } from 'node:stream';

export type DriverS3Config = {
	root?: string;
	key?: string;
	secret?: string;
	bucket: string;
	acl?: ObjectCannedACL;
	serverSideEncryption?: ServerSideEncryption;
	serverSideEncryptionKmsKeyId?: string;
	endpoint?: string;
	region?: string;
	forcePathStyle?: boolean;
	tus?: {
		chunkSize?: number;
	};
	connectionTimeout?: number;
	socketTimeout?: number;
	maxSockets?: number;
	keepAlive?: boolean;
};

export const kmsKeyIdCheck = [
	ServerSideEncryption.aws_kms,
	ServerSideEncryption.aws_kms_dsse,
] as ServerSideEncryption[];

export class DriverS3 implements TusDriver {
	private config: DriverS3Config;
	private readonly client: S3Client;
	private readonly root: string;

	// TUS specific members
	private partUploadSemaphore: Semaphore;
	private readonly preferredPartSize: number;
	public maxMultipartParts = 10_000 as const;
	public minPartSize = 5_242_880 as const; // 5MiB
	public maxUploadSize = 5_497_558_138_880 as const; // 5TiB

	constructor(config: DriverS3Config) {
		this.config = config;
		this.client = this.getClient();
		this.root = this.config.root ? normalizePath(this.config.root, { removeLeading: true }) : '';

		this.preferredPartSize = config.tus?.chunkSize ?? this.minPartSize;
		this.partUploadSemaphore = new Semaphore(60);
	}

	private getClient() {
		/*
		 * AWS' client default socket reusing can cause performance issues when using it very
		 * often in rapid succession, hitting the maxSockets limit of 50.
		 * The requestHandler is customized to get around this.
		 */
		const connectionTimeout = ms(String(this.config.connectionTimeout ?? 5000) as StringValue);
		const socketTimeout = ms(String(this.config.socketTimeout ?? 120000) as StringValue);
		const maxSockets = this.config.maxSockets ?? 500;
		const keepAlive = this.config.keepAlive ?? true;

		const s3ClientConfig: S3ClientConfig = {
			requestHandler: new NodeHttpHandler({
				connectionTimeout,
				socketTimeout,
				httpAgent: new HttpAgent({ maxSockets, keepAlive }),
				httpsAgent: new HttpsAgent({ maxSockets, keepAlive }),
			}),
		};

		if ((this.config.key && !this.config.secret) || (this.config.secret && !this.config.key)) {
			throw new Error('Both `key` and `secret` are required when defined');
		}

		if (this.config.key && this.config.secret) {
			s3ClientConfig.credentials = {
				accessKeyId: this.config.key,
				secretAccessKey: this.config.secret,
			};
		}

		if (this.config.endpoint) {
			const protocol = this.config.endpoint.startsWith('http://') ? 'http:' : 'https:';
			const hostname = this.config.endpoint.replace('https://', '').replace('http://', '');

			s3ClientConfig.endpoint = {
				hostname,
				protocol,
				path: '/',
			};
		}

		if (this.config.region) {
			s3ClientConfig.region = this.config.region;
		}

		if (this.config.forcePathStyle !== undefined) {
			s3ClientConfig.forcePathStyle = this.config.forcePathStyle;
		}

		return new S3Client(s3ClientConfig);
	}

	private fullPath(filepath: string) {
		return normalizePath(join(this.root, filepath));
	}

	async read(filepath: string, options?: ReadOptions): Promise<Readable> {
		const { range } = options ?? {};

		const commandInput: GetObjectCommandInput = {
			Key: this.fullPath(filepath),
			Bucket: this.config.bucket,
		};

		if (range) {
			commandInput.Range = `bytes=${range.start ?? ''}-${range.end ?? ''}`;
		}

		const { Body: stream } = await this.client.send(new GetObjectCommand(commandInput));

		if (!stream || !isReadableStream(stream)) {
			throw new Error(`No stream returned for file "${filepath}"`);
		}

		return stream as Readable;
	}

	async stat(filepath: string) {
		const { ContentLength, LastModified } = await this.client.send(
			new HeadObjectCommand({
				Key: this.fullPath(filepath),
				Bucket: this.config.bucket,
			}),
		);

		return {
			size: ContentLength as number,
			modified: LastModified as Date,
		};
	}

	async exists(filepath: string) {
		try {
			await this.stat(filepath);
			return true;
		} catch {
			return false;
		}
	}

	async move(src: string, dest: string) {
		await this.copy(src, dest);
		await this.delete(src);
	}

	async copy(src: string, dest: string) {
		const params: CopyObjectCommandInput = {
			Key: this.fullPath(dest),
			Bucket: this.config.bucket,
			CopySource: `/${this.config.bucket}/${this.fullPath(src)}`,
		};

		if (this.config.serverSideEncryption) {
			params.ServerSideEncryption = this.config.serverSideEncryption;

			if (kmsKeyIdCheck.includes(this.config.serverSideEncryption) && this.config.serverSideEncryptionKmsKeyId) {
				params.SSEKMSKeyId = this.config.serverSideEncryptionKmsKeyId;
			}
		}

		if (this.config.acl) {
			params.ACL = this.config.acl;
		}

		await this.client.send(new CopyObjectCommand(params));
	}

	async write(filepath: string, content: Readable, type?: string) {
		const params: PutObjectCommandInput = {
			Key: this.fullPath(filepath),
			Body: content,
			Bucket: this.config.bucket,
		};

		if (type) {
			params.ContentType = type;
		}

		if (this.config.acl) {
			params.ACL = this.config.acl;
		}

		if (this.config.serverSideEncryption) {
			params.ServerSideEncryption = this.config.serverSideEncryption;

			if (kmsKeyIdCheck.includes(this.config.serverSideEncryption) && this.config.serverSideEncryptionKmsKeyId) {
				params.SSEKMSKeyId = this.config.serverSideEncryptionKmsKeyId;
			}
		}

		const upload = new Upload({
			client: this.client,
			params,
		});

		await upload.done();
	}

	async delete(filepath: string) {
		await this.client.send(new DeleteObjectCommand({ Key: this.fullPath(filepath), Bucket: this.config.bucket }));
	}

	async *list(prefix = '') {
		let Prefix = this.fullPath(prefix);

		// Current dir (`.`) isn't known to S3, needs to be an empty prefix instead
		if (Prefix === '.') Prefix = '';

		let continuationToken: string | undefined = undefined;

		do {
			const listObjectsV2CommandInput: ListObjectsV2CommandInput = {
				Bucket: this.config.bucket,
				Prefix,
				MaxKeys: 1000,
			};

			if (continuationToken) {
				listObjectsV2CommandInput.ContinuationToken = continuationToken;
			}

			const response = await this.client.send(new ListObjectsV2Command(listObjectsV2CommandInput));

			continuationToken = response.NextContinuationToken;

			if (response.Contents) {
				for (const object of response.Contents) {
					if (!object.Key) continue;

					const isDir = object.Key.endsWith('/');

					if (isDir) continue;

					yield object.Key.substring(this.root.length);
				}
			}
		} while (continuationToken);
	}

	// TUS implementation based on https://github.com/tus/tus-node-server

	get tusExtensions() {
		return ['creation', 'termination', 'expiration'];
	}

	async createChunkedUpload(filepath: string, context: ChunkedUploadContext): Promise<ChunkedUploadContext> {
		const params: CreateMultipartUploadCommandInput = {
			Bucket: this.config.bucket,
			Key: this.fullPath(filepath),
			Metadata: { 'tus-version': TUS_RESUMABLE },
			...(context.metadata?.['contentType']
				? {
						ContentType: context.metadata['contentType'],
					}
				: {}),
			...(context.metadata?.['cacheControl']
				? {
						CacheControl: context.metadata['cacheControl'],
					}
				: {}),
		};

		if (this.config.serverSideEncryption) {
			params.ServerSideEncryption = this.config.serverSideEncryption;

			if (kmsKeyIdCheck.includes(this.config.serverSideEncryption) && this.config.serverSideEncryptionKmsKeyId) {
				params.SSEKMSKeyId = this.config.serverSideEncryptionKmsKeyId;
			}
		}

		const command = new CreateMultipartUploadCommand(params);

		const res = await this.client.send(command);

		context.metadata!['upload-id'] = res.UploadId!;

		return context;
	}

	async deleteChunkedUpload(filepath: string, context: ChunkedUploadContext): Promise<void> {
		const key = this.fullPath(filepath);

		try {
			// @ts-expect-error
			const { 'upload-id': uploadId } = context.metadata;

			if (uploadId) {
				await this.client.send(
					new AbortMultipartUploadCommand({
						Bucket: this.config.bucket,
						Key: key,
						UploadId: uploadId,
					}),
				);
			}
		} catch (error: any) {
			if (error?.code && ['NotFound', 'NoSuchKey', 'NoSuchUpload'].includes(error.Code)) {
				throw ERRORS.FILE_NOT_FOUND;
			}

			throw error;
		}

		await this.client.send(
			new DeleteObjectsCommand({
				Bucket: this.config.bucket,
				Delete: {
					Objects: [{ Key: key }],
				},
			}),
		);
	}

	async finishChunkedUpload(filepath: string, context: ChunkedUploadContext): Promise<void> {
		const key = this.fullPath(filepath);
		const uploadId = context.metadata!['upload-id'] as string;

		const size = context.size!;
		const chunkSize = this.calcOptimalPartSize(size);
		const expectedParts = Math.ceil(size / chunkSize);

		let parts = await this.retrieveParts(key, uploadId);
		let retries = 0;

		while (parts.length !== expectedParts && retries < 3) {
			// Did not receive the expected number of parts from the S3 API, retry with incremental sleeps until the number
			// of parts matches or the max number of retries is reached.
			++retries;

			await new Promise((resolve) => setTimeout(resolve, 500 * retries));
			parts = await this.retrieveParts(key, uploadId);
		}

		if (parts.length !== expectedParts) {
			throw {
				status_code: 500,
				body: 'Failed to upload all parts to S3.',
			};
		}

		await this.finishMultipartUpload(key, uploadId, parts);
	}

	async writeChunk(
		filepath: string,
		content: Readable,
		offset: number,
		context: ChunkedUploadContext,
	): Promise<number> {
		const key = this.fullPath(filepath);
		const uploadId = context.metadata!['upload-id'] as string;
		const size = context.size!;

		const parts = await this.retrieveParts(key, uploadId);
		const partNumber: number = parts.length > 0 ? parts[parts.length - 1]!.PartNumber! : 0;
		const nextPartNumber = partNumber + 1;
		const requestedOffset = offset;

		const bytesUploaded = await this.uploadParts(key, uploadId, size, content, nextPartNumber, offset);

		return requestedOffset + bytesUploaded;
	}

	private async uploadPart(
		key: string,
		uploadId: string,
		readStream: fs.ReadStream | Readable,
		partNumber: number,
	): Promise<string> {
		const data = await this.client.send(
			new UploadPartCommand({
				Bucket: this.config.bucket,
				Key: key,
				UploadId: uploadId,
				PartNumber: partNumber,
				Body: readStream,
			}),
		);

		return data.ETag as string;
	}

	private async uploadParts(
		key: string,
		uploadId: string,
		size: number,
		readStream: stream.Readable,
		currentPartNumber: number,
		offset: number,
	): Promise<number> {
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
							await this.uploadPart(key, uploadId, readable, partNumber);
							bytesUploaded += partSize;
						} else {
							// This can happen if the upload is aborted by the user mid chunk or a network issue happens
							// await this.uploadIncompletePart(metadata.file.id, readable);
						}

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
					// this.logger.error(`[${metadata.file.id}] failed to remove chunk ${pendingChunkFilepath}`);
				}
			}

			promises.push(Promise.reject(error));
		} finally {
			await Promise.all(promises);
		}

		return bytesUploaded;
	}

	private async retrieveParts(key: string, uploadId: string, partNumberMarker?: string): Promise<Part[]> {
		const data = await this.client.send(
			new ListPartsCommand({
				Bucket: this.config.bucket,
				Key: key,
				UploadId: uploadId,
				PartNumberMarker: partNumberMarker!,
			}),
		);

		let parts = data.Parts ?? [];

		if (data.IsTruncated) {
			const rest = await this.retrieveParts(key, uploadId, data.NextPartNumberMarker);
			parts = [...parts, ...rest];
		}

		if (!partNumberMarker) {
			parts.sort((a, b) => a.PartNumber! - b.PartNumber!);
		}

		return parts;
	}

	private async finishMultipartUpload(key: string, uploadId: string, parts: Part[]) {
		const command = new CompleteMultipartUploadCommand({
			Bucket: this.config.bucket,
			Key: key,
			UploadId: uploadId,
			MultipartUpload: {
				Parts: parts.map((part) => {
					return {
						ETag: part.ETag,
						PartNumber: part.PartNumber,
					} as CompletedPart;
				}),
			},
		});

		const response = await this.client.send(command);

		return response.Location;
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
}

export default DriverS3;
