import type {
	CopyObjectCommandInput,
	GetObjectCommandInput,
	ListObjectsV2CommandInput,
	PutObjectCommandInput,
	S3ClientConfig,
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
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import type { Driver, Range } from '@directus/storage';
import { normalizePath } from '@directus/utils';
import { isReadableStream } from '@directus/utils/node';
import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';
import { join } from 'node:path';
import type { Readable } from 'node:stream';

export type DriverS3Config = {
	root?: string;
	key?: string;
	secret?: string;
	bucket: string;
	acl?: string;
	serverSideEncryption?: string;
	endpoint?: string;
	region?: string;
	forcePathStyle?: boolean;
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
			})
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
		let continuationToken: string | undefined = undefined;

		do {
			const listObjectsV2CommandInput: ListObjectsV2CommandInput = {
				Bucket: this.config.bucket,
				Prefix: this.fullPath(prefix),
				MaxKeys: 1000,
			};

			if (continuationToken) {
				listObjectsV2CommandInput.ContinuationToken = continuationToken;
			}

			const response = await this.client.send(new ListObjectsV2Command(listObjectsV2CommandInput));

			continuationToken = response.NextContinuationToken;

			if (response.Contents) {
				for (const file of response.Contents) {
					if (file.Key) {
						yield file.Key.substring(this.root.length);
					}
				}
			}
		} while (continuationToken);
	}
}

export default DriverS3;
