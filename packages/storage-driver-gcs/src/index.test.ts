import { expect, describe, test, vi, afterEach } from 'vitest';
import { DriverGCS } from './index.js';
import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { Storage } from '@google-cloud/storage';

vi.mock('@directus/shared/utils/node');
vi.mock('@directus/shared/utils');
vi.mock('@google-cloud/storage');
vi.mock('node:path');

describe('#constructor', () => {
	test('Defaults root path to empty string', () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		expect(driver['root']).toBe('');
	});

	test('Normalizes config path when root is given', () => {
		const testRoot = '/root/';
		const mockRoot = 'root/';

		vi.mocked(normalizePath).mockReturnValue(mockRoot);

		new DriverGCS({
			bucket: 'test-bucket',
			root: testRoot,
		});

		expect(normalizePath).toHaveBeenCalledWith(testRoot, { removeLeading: true });
	});

	test('Instantiates Storage object with config options', () => {
		new DriverGCS({
			bucket: 'test-bucket',
			apiEndpoint: 'test-endpoint',
		});

		expect(Storage).toHaveBeenCalledWith({ apiEndpoint: 'test-endpoint' });
	});

	test('Creates bucket access instance', () => {
		const mockBucket = {};

		const mockStorage = {
			bucket: vi.fn().mockReturnValue(mockBucket),
		} as unknown as Storage;

		vi.mocked(Storage).mockReturnValueOnce(mockStorage);

		const driver = new DriverGCS({
			bucket: 'test-bucket',
			apiEndpoint: 'test-endpoint',
		});

		expect(mockStorage.bucket).toHaveBeenCalledWith('test-bucket');
		expect(driver['bucket']).toBe(mockBucket);
	});
});

describe('#fullPath', () => {
	test('Returns normalized joined path', () => {
		vi.mocked(join).mockReturnValue('root/path/to/file.txt');
		vi.mocked(normalizePath).mockReturnValue('root/path/to/file.txt');

		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		driver['root'] = 'root/';

		const result = driver['fullPath']('/path/to/file.txt');

		expect(join).toHaveBeenCalledWith('root/', '/path/to/file.txt');
		expect(normalizePath).toHaveBeenCalledWith('root/path/to/file.txt');
		expect(result).toBe('root/path/to/file.txt');
	});
});
