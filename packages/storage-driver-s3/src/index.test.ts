import { GetObjectCommand, S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import type { HeadObjectCommandOutput } from '@aws-sdk/client-s3';
import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
import { join } from 'node:path';
import { Readable, PassThrough } from 'node:stream';
import { afterEach, describe, expect, test, vi, beforeEach } from 'vitest';
import { DriverS3 } from './index.js';

vi.mock('@directus/shared/utils/node');
vi.mock('@directus/shared/utils');
vi.mock('@aws-sdk/client-s3');
vi.mock('node:path');

let driver: DriverS3;

beforeEach(() => {
	driver = new DriverS3({
		key: 'test-key',
		secret: 'test-secret',
		bucket: 'test-bucket',
	});

	driver['fullPath'] = vi.fn().mockReturnValue('root/path/to/file.txt');
});

afterEach(() => {
	vi.resetAllMocks();
});

describe('#constructor', () => {
	test('Creates S3Client with key / secret configuration', () => {
		expect(S3Client).toHaveBeenCalledWith({
			credentials: {
				accessKeyId: 'test-key',
				secretAccessKey: 'test-secret',
			},
		});

		expect(driver['client']).toBeInstanceOf(S3Client);
	});

	test('Sets private bucket reference based on config', () => {
		expect(driver['bucket']).toBe('test-bucket');
	});

	test('Sets private acl reference based on config', () => {
		const driver = new DriverS3({
			key: 'test-key',
			secret: 'test-secret',
			bucket: 'test-bucket',
			acl: 'test-acl',
		});

		expect(driver['acl']).toBe('test-acl');
	});

	test('Sets private serverSideEncryption reference based on config', () => {
		const driver = new DriverS3({
			key: 'test-key',
			secret: 'test-secret',
			bucket: 'test-bucket',
			serverSideEncryption: 'test-sse',
		});

		expect(driver['serverSideEncryption']).toBe('test-sse');
	});

	test('Defaults root to empty string', () => {
		expect(driver['root']).toBe('');
	});

	test('Normalizes config path when root is given', () => {
		const testRoot = '/root/';
		const mockRoot = 'root/';

		vi.mocked(normalizePath).mockReturnValue(mockRoot);

		const driver = new DriverS3({
			key: 'test-key',
			secret: 'test-secret',
			bucket: 'test-bucket',
			root: testRoot,
		});

		expect(normalizePath).toHaveBeenCalledWith(testRoot, { removeLeading: true });
		expect(driver['root']).toBe('root/');
	});
});

describe('#fullPath', () => {
	test('Returns normalized joined path', () => {
		const driver = new DriverS3({
			key: 'test-key',
			secret: 'test-secret',
			bucket: 'test-bucket',
		});

		vi.mocked(join).mockReturnValue('root/path/to/file.txt');
		vi.mocked(normalizePath).mockReturnValue('root/path/to/file.txt');

		driver['root'] = 'root/';

		const result = driver['fullPath']('/path/to/file.txt');

		expect(join).toHaveBeenCalledWith('root/', '/path/to/file.txt');
		expect(normalizePath).toHaveBeenCalledWith('root/path/to/file.txt');
		expect(result).toBe('root/path/to/file.txt');
	});
});

describe('#getStream', () => {
	beforeEach(() => {
		driver['fullPath'] = vi.fn().mockReturnValue('root/path/to/file.txt');
		vi.mocked(driver['client'].send).mockReturnValue({ Body: new Readable() } as unknown as void);
		vi.mocked(isReadableStream).mockReturnValue(true);
	});

	test('Uses fullPath key / bucket in command input', async () => {
		await driver.getStream('/path/to/file.txt');

		expect(driver['fullPath']).toHaveBeenCalledWith('/path/to/file.txt');
		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: 'root/path/to/file.txt',
			Bucket: 'test-bucket',
		});
	});

	test('Optionally allows setting start range offset', async () => {
		await driver.getStream('/path/to/file.txt', { start: 500 });

		expect(driver['fullPath']).toHaveBeenCalledWith('/path/to/file.txt');
		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: 'root/path/to/file.txt',
			Bucket: 'test-bucket',
			Range: 'bytes=500-',
		});
	});

	test('Optionally allows setting end range offset', async () => {
		await driver.getStream('/path/to/file.txt', { end: 1500 });

		expect(driver['fullPath']).toHaveBeenCalledWith('/path/to/file.txt');
		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: 'root/path/to/file.txt',
			Bucket: 'test-bucket',
			Range: 'bytes=-1500',
		});
	});

	test('Optionally allows setting start and end range offset', async () => {
		await driver.getStream('/path/to/file.txt', { start: 500, end: 1500 });

		expect(driver['fullPath']).toHaveBeenCalledWith('/path/to/file.txt');
		expect(GetObjectCommand).toHaveBeenCalledWith({
			Key: 'root/path/to/file.txt',
			Bucket: 'test-bucket',
			Range: 'bytes=500-1500',
		});
	});

	test('Throws an error when no stream is returned', async () => {
		vi.mocked(driver['client'].send).mockReturnValue({ Body: undefined } as unknown as void);

		expect(driver.getStream('/path/to/file.txt', { start: 500, end: 1500 })).rejects.toThrowErrorMatchingInlineSnapshot(
			'"No stream returned for file \\"/path/to/file.txt\\""'
		);
	});

	test('Throws an error when returned stream is not a readable stream', async () => {
		vi.mocked(isReadableStream).mockReturnValue(false);

		expect(driver.getStream('/path/to/file.txt', { start: 500, end: 1500 })).rejects.toThrowErrorMatchingInlineSnapshot(
			'"No stream returned for file \\"/path/to/file.txt\\""'
		);
	});

	test('Returns stream from S3 client', async () => {
		const mockGetObjectCommand = {} as GetObjectCommand;
		const mockStream = {};

		vi.mocked(driver['client'].send).mockReturnValue({ Body: mockStream } as unknown as void);
		vi.mocked(GetObjectCommand).mockReturnValue(mockGetObjectCommand);

		const stream = await driver.getStream('/path/to/file.txt', { start: 500, end: 1500 });

		expect(driver['client'].send).toHaveBeenCalledWith(mockGetObjectCommand);
		expect(stream).toBe(mockStream);
	});
});

describe('#getBuffer', () => {
	let mockStream: PassThrough;

	beforeEach(() => {
		mockStream = new PassThrough();
		driver.getStream = vi.fn().mockResolvedValue(mockStream);
	});

	test('Gets stream for given location', async () => {
		process.nextTick(() => {
			mockStream.emit('end');
		});

		await driver.getBuffer('/path/to/file.txt');

		expect(driver.getStream).toHaveBeenCalledWith('/path/to/file.txt');
	});

	test('Resolves buffer from stream contents', async () => {
		process.nextTick(() => {
			mockStream.emit('data', Buffer.from('test-'));
			mockStream.emit('data', Buffer.from('data'));
			mockStream.emit('end');
		});

		const buffer = await driver.getBuffer('/path/to/file.txt');

		expect(buffer).toBeInstanceOf(Buffer);
		expect(buffer).toStrictEqual(Buffer.from('test-data'));
	});

	test('Rejects with error on stream error', async () => {
		const mockError = new Error('Whoops');

		process.nextTick(() => {
			mockStream.emit('error', mockError);
		});

		try {
			await driver.getBuffer('/path/to/file.txt');
		} catch (err) {
			expect(err).toBe(mockError);
		}
	});

	test('Rejects with error thrown from getStream', async () => {
		const mockError = new Error('Whoops');
		vi.mocked(driver.getStream).mockRejectedValue(mockError);
		expect(driver.getBuffer('/path/to/file.txt')).rejects.toThrowError(mockError);
	});
});

describe('#getStat', () => {
	beforeEach(() => {
		vi.mocked(driver['client'].send).mockResolvedValue({
			ContentLength: 500,
			LastModified: new Date(2022, 11, 7, 14, 52, 0, 0),
		} as HeadObjectCommandOutput as unknown as void);
	});

	test('Uses HeadObjectCommand with fullPath', async () => {
		await driver.getStat('/path/to/file.txt');
		expect(driver['fullPath']).toHaveBeenCalledWith('/path/to/file.txt');
		expect(HeadObjectCommand).toHaveBeenCalledWith({
			Key: 'root/path/to/file.txt',
			Bucket: 'test-bucket',
		});
	});

	test('Calls #send with HeadObjectCommand', async () => {
		const mockHeadObjectCommand = {} as HeadObjectCommand;
		vi.mocked(HeadObjectCommand).mockReturnValue(mockHeadObjectCommand);
		await driver.getStat('/path/to/file.txt');
		expect(driver['client'].send).toHaveBeenCalledWith(mockHeadObjectCommand);
	});
});

describe('#exists', () => {
	test('Returns true if stat returns the stats', async () => {
		driver.getStat = vi.fn().mockResolvedValue({});
		const exists = await driver.exists('path/to/file.txt');
		expect(exists).toBe(true);
	});

	test('Returns false if stat throws an error', async () => {
		driver.getStat = vi.fn().mockRejectedValue(new Error('Something went wrong'));
		const exists = await driver.exists('path/to/file.txt');
		expect(exists).toBe(false);
	});
});

describe.todo('#move', () => {});

describe.todo('#copy', () => {});

describe.todo('#put', () => {});

describe.todo('#delete', () => {});

describe.todo('#list', () => {});
