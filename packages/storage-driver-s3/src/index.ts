import type { GetObjectCommandInput, S3ClientConfig, HeadObjectCommandInput } from '@aws-sdk/client-s3';
import { GetObjectCommand, S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
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

	async move(src: string, dest: string) {}

	async copy(src: string, dest: string) {}

	async put(filepath: string, content: Buffer | NodeJS.ReadableStream | string, type = 'application/octet-stream') {}

	async delete(filepath: string) {}

	async *list(prefix = '') {}
}

export default DriverS3;
