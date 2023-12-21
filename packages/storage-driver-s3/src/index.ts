import type {
	CopyObjectCommandInput,
	GetObjectCommandInput,
	HeadObjectCommandInput,
	ListObjectsV2CommandInput,
	ObjectCannedACL,
	PutObjectCommandInput,
	S3ClientConfig,
	ServerSideEncryption,
} from '@aws-sdk/client-s3';
import {
	CopyObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import type { Driver, Range } from '@directus/storage';
import { normalizePath } from '@directus/utils';
import { isReadableStream } from '@directus/utils/node';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { join } from 'node:path';
import type { Readable } from 'node:stream';

export type DriverS3Config = {
	root?: string;
	key?: string;
	secret?: string;
	bucket: string;
	acl?: ObjectCannedACL;
	serverSideEncryption?: ServerSideEncryption;
	endpoint?: string;
	region?: string;
	forcePathStyle?: boolean;
	sseKmsKeyId?: string;
};

export class DriverS3 implements Driver {
	private config: DriverS3Config;
	private client: S3Client;
	private root: string;

	constructor(config: DriverS3Config) {
		this.config = config;
		this.client = this.getClient();
		this.root = this.config.root ? normalizePath(this.config.root, { removeLeading: true }) : '';
	}

	private getClient() {
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

	async read(filepath: string, range?: Range): Promise<Readable> {
		const commandInput: GetObjectCommandInput = {
			Key: this.fullPath(filepath),
			Bucket: this.config.bucket,
		};

		if (range) {
			commandInput.Range = `bytes=${range.start ?? ''}-${range.end ?? ''}`;
		}

		if (this.config.serverSideEncryption == 'aws:kms' && this.config.sseKmsKeyId) {
			commandInput.SSECustomerKey = this.config.sseKmsKeyId;
		}

		const { Body: stream } = await this.client.send(new GetObjectCommand(commandInput));

		if (!stream || !isReadableStream(stream)) {
			throw new Error(`No stream returned for file "${filepath}"`);
		}

		return stream as Readable;
	}

	async stat(filepath: string) {
		const commandInput: HeadObjectCommandInput = {
			Key: this.fullPath(filepath),
			Bucket: this.config.bucket,
		};

		if (this.config.serverSideEncryption == 'aws:kms' && this.config.sseKmsKeyId) {
			commandInput.SSECustomerKey = this.config.sseKmsKeyId;
		}

		const { ContentLength, LastModified } = await this.client.send(new HeadObjectCommand(commandInput));

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
		const commandInput: CopyObjectCommandInput = {
			Key: this.fullPath(dest),
			Bucket: this.config.bucket,
			CopySource: `/${this.config.bucket}/${this.fullPath(src)}`,
		};

		if (this.config.serverSideEncryption) {
			commandInput.ServerSideEncryption = this.config.serverSideEncryption;

			if (this.config.serverSideEncryption == 'aws:kms' && this.config.sseKmsKeyId) {
				commandInput.SSECustomerKey = this.config.sseKmsKeyId;
			}
		}

		if (this.config.acl) {
			commandInput.ACL = this.config.acl;
		}

		await this.client.send(new CopyObjectCommand(commandInput));
	}

	async write(filepath: string, content: Readable, type?: string) {
		const commandInput: PutObjectCommandInput = {
			Key: this.fullPath(filepath),
			Body: content,
			Bucket: this.config.bucket,
		};

		if (type) {
			commandInput.ContentType = type;
		}

		if (this.config.acl) {
			commandInput.ACL = this.config.acl;
		}

		if (this.config.serverSideEncryption) {
			commandInput.ServerSideEncryption = this.config.serverSideEncryption;

			if (this.config.serverSideEncryption == 'aws:kms' && this.config.sseKmsKeyId) {
				commandInput.SSECustomerKey = this.config.sseKmsKeyId;
			}
		}

		const upload = new Upload({
			client: this.client,
			params: commandInput,
		});

		await upload.done();
	}

	async delete(filepath: string) {
		await this.client.send(new DeleteObjectCommand({ Key: this.fullPath(filepath), Bucket: this.config.bucket }));
	}

	async *list(pathPrefix = '') {
		let prefix = this.fullPath(pathPrefix);

		// Current dir (`.`) isn't known to S3, needs to be an empty prefix instead
		if (prefix === '.') {
			prefix = '';
		}

		let continuationToken: string | undefined = undefined;

		do {
			const commandInput: ListObjectsV2CommandInput = {
				Bucket: this.config.bucket,
				Prefix: prefix,
				MaxKeys: 1000,
			};

			if (continuationToken) {
				commandInput.ContinuationToken = continuationToken;
			}

			const response = await this.client.send(new ListObjectsV2Command(commandInput));

			continuationToken = response.NextContinuationToken;

			if (!response.Contents) {
				continue;
			}

			for (const object of response.Contents) {
				if (!object.Key) {
					continue;
				}

				const isDir = object.Key.endsWith('/');

				if (isDir) {
					continue;
				}

				yield object.Key.substring(this.root.length);
			}
		} while (continuationToken);
	}
}

export default DriverS3;
