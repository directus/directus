import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DriverS3 } from './index.js';
import { S3Client } from '@aws-sdk/client-s3';

vi.mock('@directus/shared/utils/node');
vi.mock('@directus/shared/utils');
vi.mock('@aws-sdk/client-s3');
vi.mock('node:path');

afterEach(() => {
	vi.resetAllMocks();
});

describe('#constructor', () => {
	test('Creates S3Client with key / secret configuration', () => {
		const driver = new DriverS3({
			key: 'test-key',
			secret: 'test-secret',
			bucket: 'test-bucket',
		});

		expect(S3Client).toHaveBeenCalledWith({
			credentials: {
				accessKeyId: 'test-key',
				secretAccessKey: 'test-secret',
			},
		});

		expect(driver['client']).toBeInstanceOf(S3Client);
	});

	test('Sets private bucket reference based on config', () => {
		const driver = new DriverS3({
			key: 'test-key',
			secret: 'test-secret',
			bucket: 'test-bucket',
		});

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
		const driver = new DriverS3({
			key: 'test-key',
			secret: 'test-secret',
			bucket: 'test-bucket',
		});

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
		vi.mocked(join).mockReturnValue('root/path/to/file.txt');
		vi.mocked(normalizePath).mockReturnValue('root/path/to/file.txt');

		const driver = new DriverS3({
			key: 'test-key',
			secret: 'test-secret',
			bucket: 'test-bucket',
		});

		driver['root'] = 'root/';

		const result = driver['fullPath']('/path/to/file.txt');

		expect(join).toHaveBeenCalledWith('root/', '/path/to/file.txt');
		expect(normalizePath).toHaveBeenCalledWith('root/path/to/file.txt');
		expect(result).toBe('root/path/to/file.txt');
	});
});

describe.todo('#getStream', () => {});

describe.todo('#getBuffer', () => {});

describe.todo('#getStat', () => {});

describe.todo('#exists', () => {});

describe.todo('#move', () => {});

describe.todo('#copy', () => {});

describe.todo('#put', () => {});

describe.todo('#delete', () => {});

describe.todo('#list', () => {});
