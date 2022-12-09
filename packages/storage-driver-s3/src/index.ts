import type {
	GetObjectCommandInput,
	S3ClientConfig,
	CopyObjectCommandInput,
	PutObjectCommandInput,
	ListObjectsV2CommandInput,
} from '@aws-sdk/client-s3';
import {
	GetObjectCommand,
	S3Client,
	HeadObjectCommand,
	CopyObjectCommand,
	DeleteObjectCommand,
	PutObjectCommand,
	ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
import type { Driver, Range } from '@directus/storage';
import { join } from 'node:path';

export type DriverS3Config = {
	root?: string;
	key: string;
	secret: string;
	bucket: string;
	acl?: string;
	serverSideEncryption?: string;
	endpoint?: string;
};

export class DriverS3 implements Driver {
	private root: string;
	private client: S3Client;
	private bucket: string;
	private acl: string | undefined;
	private serverSideEncryption: string | undefined;

	constructor(config: DriverS3Config) {
		const s3ClientConfig: S3ClientConfig = {
			credentials: {
				accessKeyId: config.key,
				secretAccessKey: config.secret,
			},
		};

		if (config.endpoint) {
			const protocol = config.endpoint.startsWith('https://') ? 'https:' : 'http:';
			const hostname = config.endpoint.replace('https://', '').replace('http://', '');

			s3ClientConfig.endpoint = {
				hostname,
				protocol,
				path: '/',
			};

			s3ClientConfig.forcePathStyle = true;
		}

		this.client = new S3Client(s3ClientConfig);
		this.bucket = config.bucket;
		this.acl = config.acl;
		this.serverSideEncryption = config.serverSideEncryption;
		this.root = config.root ? normalizePath(config.root, { removeLeading: true }) : '';
	}

	private fullPath(filepath: string) {
		return normalizePath(join(this.root, filepath));
	}

	async getStream(filepath: string, range?: Range): Promise<NodeJS.ReadableStream> {
		const commandInput: GetObjectCommandInput = {
			Key: this.fullPath(filepath),
			Bucket: this.bucket,
		};

		if (range) {
			commandInput.Range = `bytes=${range.start ?? ''}-${range.end ?? ''}`;
		}

		const { Body: stream } = await this.client.send(new GetObjectCommand(commandInput));

		if (!stream || !isReadableStream(stream)) {
			throw new Error(`No stream returned for file "${filepath}"`);
		}

		return stream;
	}

	getBuffer(filepath: string) {
		return new Promise<Buffer>((resolve, reject) => {
			const data: any[] = [];

			this.getStream(filepath)
				.then((stream) => {
					stream.on('data', (chunk) => data.push(chunk));
					stream.on('end', () => resolve(Buffer.concat(data)));
					stream.on('error', (err) => reject(err));
				})
				.catch((err) => reject(err));
		});
	}

	async getStat(filepath: string) {
		const { ContentLength, LastModified } = await this.client.send(
			new HeadObjectCommand({
				Key: this.fullPath(filepath),
				Bucket: this.bucket,
			})
		);

		return {
			size: ContentLength as number,
			modified: LastModified as Date,
		};
	}

	async exists(filepath: string) {
		try {
			await this.getStat(filepath);
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
			Bucket: this.bucket,
			CopySource: `/${this.bucket}/${this.fullPath(src)}`,
		};

		if (this.serverSideEncryption) {
			params.ServerSideEncryption = this.serverSideEncryption;
		}

		if (this.acl) {
			params.ACL = this.acl;
		}

		await this.client.send(new CopyObjectCommand(params));
	}

	async put(filepath: string, content: Buffer | NodeJS.ReadableStream | string, type?: string) {
		const params: PutObjectCommandInput = {
			Key: this.fullPath(filepath),
			Body: content,
			Bucket: this.bucket,
		};

		if (type) {
			params.ContentType = type;
		}

		if (this.acl) {
			params.ACL = this.acl;
		}

		if (this.serverSideEncryption) {
			params.ServerSideEncryption = this.serverSideEncryption;
		}

		await this.client.send(new PutObjectCommand(params));
	}

	async delete(filepath: string) {
		await this.client.send(new DeleteObjectCommand({ Key: this.fullPath(filepath), Bucket: this.bucket }));
	}

	async *list(prefix = '') {
		let continuationToken: string | undefined = undefined;

		do {
			const listObjectsV2CommandInput: ListObjectsV2CommandInput = {
				Bucket: this.bucket,
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
