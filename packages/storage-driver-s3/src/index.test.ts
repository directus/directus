import type { HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import {
	CopyObjectCommand,
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	ListObjectsV2Command,
	S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { normalizePath } from '@directus/utils';
import { isReadableStream } from '@directus/utils/node';
import {
	randAlphaNumeric,
	randBoolean,
	randGitBranch as randBucket,
	randDirectoryPath,
	randDomainName,
	randFilePath,
	randFileType,
	randNumber,
	randPastDate,
	randText,
	randGitShortSha as randUnique,
	randWord,
} from '@ngneat/falso';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { join } from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { DriverS3Config } from './index.js';
import { DriverS3 } from './index.js';

vi.mock('@directus/utils/node');
vi.mock('@directus/utils');
vi.mock('@aws-sdk/client-s3');
vi.mock('@aws-sdk/lib-storage');
vi.mock('node:path');

let sample: {
	config: Required<DriverS3Config>;
	path: {
		input: string;
		inputFull: string;
		src: string;
		srcFull: string;
		dest: string;
		destFull: string;
	};
	range: {
		start: number;
		end: number;
	};
	stream: PassThrough;
	text: string;
	file: {
		type: string;
		size: number;
		modified: Date;
	};
};

let driver: DriverS3;

beforeEach(() => {
	sample = {
		config: {
			key: randAlphaNumeric({ length: 20 }).join(''),
			secret: randAlphaNumeric({ length: 40 }).join(''),
			bucket: randBucket(),
			acl: randWord(),
			serverSideEncryption: randWord(),
			root: randDirectoryPath(),
			endpoint: randDomainName(),
			region: randWord(),
			forcePathStyle: randBoolean(),
		},
		path: {
			input: randUnique() + randFilePath(),
			inputFull: randUnique() + randFilePath(),
			src: randUnique() + randFilePath(),
			srcFull: randUnique() + randFilePath(),
			dest: randUnique() + randFilePath(),
			destFull: randUnique() + randFilePath(),
		},
		range: {
			start: randNumber(),
			end: randNumber(),
		},
		stream: new PassThrough(),
		text: randText(),
		file: {
			type: randFileType(),
			size: randNumber(),
			modified: randPastDate(),
		},
	};

	driver = new DriverS3({
		key: sample.config.key,
		secret: sample.config.secret,
		bucket: sample.config.bucket,
	});

	driver['fullPath'] = vi.fn().mockImplementation((input) => {
		if (input === sample.path.src) return sample.path.srcFull;
		if (input === sample.path.dest) return sample.path.destFull;
		if (input === sample.path.input) return sample.path.inputFull;

		return '';
	});
});

afterEach(() => {
	vi.resetAllMocks();
});

describe('#constructor', () => {
	let getClientBackup: (typeof DriverS3.prototype)['getClient'];
	let sampleClient: S3Client;

	beforeEach(() => {
		getClientBackup = DriverS3.prototype['getClient'];
		sampleClient = {} as S3Client;
		DriverS3.prototype['getClient'] = vi.fn().mockReturnValue(sampleClient);
	});

	afterEach(() => {
		DriverS3.prototype['getClient'] = getClientBackup;
	});

	test('Saves passed config to local property', () => {
		const driver = new DriverS3(sample.config);
		expect(driver['config']).toBe(sample.config);
	});

	test('Creates shared client', () => {
		const driver = new DriverS3(sample.config);
		expect(driver['getClient']).toHaveBeenCalledOnce();
		expect(driver['client']).toBe(sampleClient);
	});

	test('Defaults root to empty string', () => {
		expect(driver['root']).toBe('');
	});

	test('Normalizes config path when root is given', () => {
		const mockRoot = randDirectoryPath();

		vi.mocked(normalizePath).mockReturnValue(mockRoot);

		const driver = new DriverS3({
			key: sample.config.key,
			secret: sample.config.secret,
			bucket: sample.config.bucket,
			root: sample.config.root,
		});

		expect(normalizePath).toHaveBeenCalledWith(sample.config.root, { removeLeading: true });
		expect(driver['root']).toBe(mockRoot);
	});
});

describe('#getClient', () => {
	// The constructor calls getClient(), so we don't have to call it separately

	test('Throws error if key defined but secret missing', () => {
		try {
			new DriverS3({ key: 'key', bucket: 'bucket' });
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe('Both `key` and `secret` are required when defined');
		}
	});

	test('Throws error if secret defined but key missing', () => {
		try {
			new DriverS3({ secret: 'secret', bucket: 'bucket' });
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe('Both `key` and `secret` are required when defined');
		}
	});

	test('Creates S3Client without key / secret (based on machine config)', () => {
		const driver = new DriverS3({ bucket: 'bucket' });

		expect(S3Client).toHaveBeenCalledWith({ requestHandler: expect.any(NodeHttpHandler) });

		expect(driver['client']).toBeInstanceOf(S3Client);
	});

	test('Creates S3Client with key / secret configuration', () => {
		expect(S3Client).toHaveBeenCalledWith({
			credentials: {
				accessKeyId: sample.config.key,
				secretAccessKey: sample.config.secret,
			},
			requestHandler: expect.any(NodeHttpHandler),
		});

		expect(driver['client']).toBeInstanceOf(S3Client);
	});

	test('Sets http endpoints', () => {
		const sampleDomain = randDomainName();
		const sampleHttpEndpoint = `http://${sampleDomain}`;

		new DriverS3({
			key: sample.config.key,
			secret: sample.config.secret,
			bucket: sample.config.bucket,
			endpoint: sampleHttpEndpoint,
		});

		expect(S3Client).toHaveBeenCalledWith({
			endpoint: {
				hostname: sampleDomain,
				protocol: 'http:',
				path: '/',
			},
			credentials: {
				accessKeyId: sample.config.key,
				secretAccessKey: sample.config.secret,
			},
			requestHandler: expect.any(NodeHttpHandler),
		});
	});

	test('Sets https endpoints', () => {
		const sampleDomain = randDomainName();
		const sampleHttpEndpoint = `https://${sampleDomain}`;

		new DriverS3({
			key: sample.config.key,
			secret: sample.config.secret,
			bucket: sample.config.bucket,
			endpoint: sampleHttpEndpoint,
		});

		expect(S3Client).toHaveBeenCalledWith({
			endpoint: {
				hostname: sampleDomain,
				protocol: 'https:',
				path: '/',
			},
			credentials: {
				accessKeyId: sample.config.key,
				secretAccessKey: sample.config.secret,
			},
			requestHandler: expect.any(NodeHttpHandler),
		});
	});

	test('Sets region', () => {
		new DriverS3({
			key: sample.config.key,
			secret: sample.config.secret,
			bucket: sample.config.bucket,
			region: sample.config.region,
		});

		expect(S3Client).toHaveBeenCalledWith({
			region: sample.config.region,
			credentials: {
				accessKeyId: sample.config.key,
				secretAccessKey: sample.config.secret,
			},
			requestHandler: expect.any(NodeHttpHandler),
		});
	});

	test('Sets force path style', () => {
		new DriverS3({
			key: sample.config.key,
			secret: sample.config.secret,
			bucket: sample.config.bucket,
			forcePathStyle: sample.config.forcePathStyle,
		});

		expect(S3Client).toHaveBeenCalledWith({
			forcePathStyle: sample.config.forcePathStyle,
			credentials: {
				accessKeyId: sample.config.key,
				secretAccessKey: sample.config.secret,
			},
			requestHandler: expect.any(NodeHttpHandler),
		});
	});
});

describe('#fullPath', () => {
	test('Returns normalized joined path', () => {
		const driver = new DriverS3({
			key: sample.config.key,
			secret: sample.config.secret,
			bucket: sample.config.bucket,
		});

		vi.mocked(join).mockReturnValue(sample.path.inputFull);
		vi.mocked(normalizePath).mockReturnValue(sample.path.inputFull);

		driver['root'] = sample.config.root;

		const result = driver['fullPath'](sample.path.input);

		expect(join).toHaveBeenCalledWith(sample.config.root, sample.path.input);
		expect(normalizePath).toHaveBeenCalledWith(sample.path.inputFull);
		expect(result).toBe(sample.path.inputFull);
	});
});

describe('#read', () => {
	beforeEach(() => {
		vi.mocked(driver['client'].send).mockReturnValue({ Body: new Readable() } as unknown as void);
		vi.mocked(isReadableStream).mockReturnValue(true);
	});

	test('Uses fullPath key / bucket in command input', async () => {
		await driver.read(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);

		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.inputFull,
			Bucket: sample.config.bucket,
		});
	});

	test('Optionally allows setting start range offset', async () => {
		await driver.read(sample.path.input, { start: sample.range.start });

		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.inputFull,
			Bucket: sample.config.bucket,
			Range: `bytes=${sample.range.start}-`,
		});
	});

	test('Optionally allows setting end range offset', async () => {
		await driver.read(sample.path.input, { end: sample.range.end });

		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.inputFull,
			Bucket: sample.config.bucket,
			Range: `bytes=-${sample.range.end}`,
		});
	});

	test('Optionally allows setting start and end range offset', async () => {
		await driver.read(sample.path.input, sample.range);

		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.inputFull,
			Bucket: sample.config.bucket,
			Range: `bytes=${sample.range.start}-${sample.range.end}`,
		});
	});

	test('Throws an error when no stream is returned', async () => {
		vi.mocked(driver['client'].send).mockReturnValue({ Body: undefined } as unknown as void);

		try {
			await driver.read(sample.path.input, sample.range);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`No stream returned for file "${sample.path.input}"`);
		}
	});

	test('Throws an error when returned stream is not a readable stream', async () => {
		vi.mocked(isReadableStream).mockReturnValue(false);

		expect(driver.read(sample.path.input, sample.range)).rejects.toThrowError(
			new Error(`No stream returned for file "${sample.path.input}"`),
		);
	});

	test('Returns stream from S3 client', async () => {
		const mockGetObjectCommand = {} as GetObjectCommand;

		vi.mocked(driver['client'].send).mockReturnValue({ Body: sample.stream } as unknown as void);
		vi.mocked(GetObjectCommand).mockReturnValue(mockGetObjectCommand);

		const stream = await driver.read(sample.path.input, sample.range);

		expect(driver['client'].send).toHaveBeenCalledWith(mockGetObjectCommand);
		expect(stream).toBe(sample.stream);
	});
});

describe('#stat', () => {
	beforeEach(() => {
		vi.mocked(driver['client'].send).mockResolvedValue({
			ContentLength: sample.file.size,
			LastModified: sample.file.modified,
		} as HeadObjectCommandOutput as unknown as void);
	});

	test('Uses HeadObjectCommand with fullPath', async () => {
		await driver.stat(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);

		expect(HeadObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.inputFull,
			Bucket: sample.config.bucket,
		});
	});

	test('Calls #send with HeadObjectCommand', async () => {
		const mockHeadObjectCommand = {} as HeadObjectCommand;
		vi.mocked(HeadObjectCommand).mockReturnValue(mockHeadObjectCommand);

		await driver.stat(sample.path.input);

		expect(driver['client'].send).toHaveBeenCalledWith(mockHeadObjectCommand);
	});

	test('Returns size/modified from returned send data', async () => {
		const result = await driver.stat(sample.path.input);

		expect(result).toStrictEqual({
			size: sample.file.size,
			modified: sample.file.modified,
		});
	});
});

describe('#exists', () => {
	beforeEach(() => {
		driver.stat = vi.fn();
	});

	test('Returns true if stat returns the stats', async () => {
		vi.mocked(driver.stat).mockResolvedValue({ size: sample.file.size, modified: sample.file.modified });

		const exists = await driver.exists(sample.path.input);

		expect(exists).toBe(true);
	});

	test('Returns false if stat throws an error', async () => {
		vi.mocked(driver.stat).mockRejectedValue(new Error());

		const exists = await driver.exists(sample.path.input);

		expect(exists).toBe(false);
	});
});

describe('#move', () => {
	beforeEach(async () => {
		driver.copy = vi.fn();
		driver.delete = vi.fn();

		await driver.move(sample.path.src, sample.path.dest);
	});

	test('Calls copy with given src and dest', async () => {
		expect(driver.copy).toHaveBeenCalledWith(sample.path.src, sample.path.dest);
	});

	test('Calls delete on successful copy', async () => {
		expect(driver.delete).toHaveBeenCalledWith(sample.path.src);
	});
});

describe('#copy', () => {
	test('Constructs params object based on config', async () => {
		await driver.copy(sample.path.src, sample.path.dest);

		expect(CopyObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.destFull,
			Bucket: sample.config.bucket,
			CopySource: `/${sample.config.bucket}/${sample.path.srcFull}`,
		});
	});

	test('Optionally sets ServerSideEncryption', async () => {
		driver['config'].serverSideEncryption = sample.config.serverSideEncryption;

		await driver.copy(sample.path.src, sample.path.dest);

		expect(CopyObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.destFull,
			Bucket: sample.config.bucket,
			CopySource: `/${sample.config.bucket}/${sample.path.srcFull}`,
			ServerSideEncryption: sample.config.serverSideEncryption,
		});
	});

	test('Optionally sets ACL', async () => {
		driver['config'].acl = sample.config.acl;

		await driver.copy(sample.path.src, sample.path.dest);

		expect(CopyObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.destFull,
			Bucket: sample.config.bucket,
			CopySource: `/${sample.config.bucket}/${sample.path.srcFull}`,
			ACL: sample.config.acl,
		});
	});

	test('Executes CopyObjectCommand', async () => {
		const mockCommand = {} as CopyObjectCommand;
		vi.mocked(CopyObjectCommand).mockReturnValue(mockCommand);

		await driver.copy(sample.path.src, sample.path.dest);

		expect(driver['client'].send).toHaveBeenCalledWith(mockCommand);
	});
});

describe('#write', () => {
	test('Passes streams to body as is', async () => {
		await driver.write(sample.path.input, sample.stream);

		expect(Upload).toHaveBeenCalledWith({
			client: driver['client'],
			params: {
				Key: sample.path.inputFull,
				Bucket: sample.config.bucket,
				Body: sample.stream,
			},
		});
	});

	test('Optionally sets ContentType', async () => {
		await driver.write(sample.path.input, sample.stream, sample.file.type);

		expect(Upload).toHaveBeenCalledWith({
			client: driver['client'],
			params: {
				Key: sample.path.inputFull,
				Bucket: sample.config.bucket,
				Body: sample.stream,
				ContentType: sample.file.type,
			},
		});
	});

	test('Optionally sets ServerSideEncryption', async () => {
		driver['config'].serverSideEncryption = sample.config.serverSideEncryption;

		await driver.write(sample.path.input, sample.stream);

		expect(Upload).toHaveBeenCalledWith({
			client: driver['client'],
			params: {
				Key: sample.path.inputFull,
				Bucket: sample.config.bucket,
				Body: sample.stream,
				ServerSideEncryption: sample.config.serverSideEncryption,
			},
		});
	});

	test('Optionally sets ACL', async () => {
		driver['config'].acl = sample.config.acl;

		await driver.write(sample.path.input, sample.stream);

		expect(Upload).toHaveBeenCalledWith({
			client: driver['client'],
			params: {
				Key: sample.path.inputFull,
				Bucket: sample.config.bucket,
				Body: sample.stream,
				ACL: sample.config.acl,
			},
		});
	});

	test('Waits for upload to be done', async () => {
		const mockUpload = { done: vi.fn() };
		vi.mocked(Upload).mockReturnValue(mockUpload as unknown as Upload);

		await driver.write(sample.path.input, sample.stream);

		expect(mockUpload.done).toHaveBeenCalledOnce();
	});
});

describe('#delete', () => {
	test('Constructs params based on input', async () => {
		await driver.delete(sample.path.input);

		expect(DeleteObjectCommand).toHaveBeenCalledWith({
			Key: sample.path.inputFull,
			Bucket: sample.config.bucket,
		});
	});

	test('Executes DeleteObjectCommand', async () => {
		const mockDeleteObjectCommand = {} as DeleteObjectCommand;
		vi.mocked(DeleteObjectCommand).mockReturnValue(mockDeleteObjectCommand);

		await driver.delete(sample.path.input);

		expect(driver['client'].send).toHaveBeenCalledWith(mockDeleteObjectCommand);
	});
});

describe('#list', () => {
	test('Constructs list objects params based on input prefix', async () => {
		vi.mocked(driver['client'].send).mockResolvedValue({} as unknown as void);

		await driver.list(sample.path.input).next();

		expect(ListObjectsV2Command).toHaveBeenCalledWith({
			Bucket: sample.config.bucket,
			Prefix: sample.path.inputFull,
			MaxKeys: 1000,
		});
	});

	test('Calls send with the command', async () => {
		const mockListObjectsV2Command = {} as ListObjectsV2Command;
		vi.mocked(ListObjectsV2Command).mockReturnValue(mockListObjectsV2Command);
		vi.mocked(driver['client'].send).mockResolvedValue({} as unknown as void);

		await driver.list(sample.path.input).next();

		expect(driver['client'].send).toHaveBeenCalledWith(mockListObjectsV2Command);
	});

	test('Yields file Key omitting root', async () => {
		const sampleRoot = randDirectoryPath();
		const sampleFile = randFilePath();
		const sampleFull = `${sampleRoot}${sampleFile}`;

		vi.mocked(driver['client'].send).mockResolvedValue({
			Contents: [
				{
					Key: sampleFull,
				},
			],
		} as unknown as void);

		driver['root'] = sampleRoot;

		const iterator = driver.list(sample.path.input);

		const output = [];

		for await (const filepath of iterator) {
			output.push(filepath);
		}

		expect(output).toStrictEqual([sampleFile]);
	});

	test('Continuously fetches until all pages are returned', async () => {
		vi.mocked(driver['client'].send)
			.mockResolvedValueOnce({
				NextContinuationToken: randWord(),
				Contents: [
					{
						Key: randFilePath(),
					},
					{
						Key: randFilePath(),
					},
				],
			} as unknown as void)
			.mockResolvedValueOnce({
				NextContinuationToken: randWord(),
				Contents: [
					{
						Key: randFilePath(),
					},
				],
			} as unknown as void)
			.mockResolvedValueOnce({
				NextContinuationToken: undefined,
				Contents: [
					{
						Key: randFilePath(),
					},
				],
			} as unknown as void);

		const iterator = driver.list(sample.path.input);

		const output = [];

		for await (const filepath of iterator) {
			output.push(filepath);
		}

		expect(driver['client'].send).toHaveBeenCalledTimes(3);
		expect(output.length).toBe(4);
	});
});
