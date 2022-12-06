import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
import { Bucket, Storage } from '@google-cloud/storage';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DriverGCS } from './index.js';

vi.mock('@directus/shared/utils/node');
vi.mock('@directus/shared/utils');
vi.mock('@google-cloud/storage');
vi.mock('node:path');
vi.mock('node:stream/promises');

afterEach(() => {
	vi.resetAllMocks();
});

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

describe('#file', () => {
	test('Uses fullPath to inject root', () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		driver['fullPath'] = vi.fn();
		driver['bucket'] = {
			file: vi.fn(),
		} as unknown as Bucket;

		driver['file']('/path/to/file');

		expect(driver['fullPath']).toHaveBeenCalledWith('/path/to/file');
	});

	test('Returns file instance', () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockFile = {};

		driver['fullPath'] = vi.fn();
		driver['bucket'] = {
			file: vi.fn().mockReturnValue(mockFile),
		} as unknown as Bucket;

		const file = driver['file']('/path/to/file');

		expect(file).toBe(mockFile);
	});
});

describe('#getStream', () => {
	test('Gets file reference', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		driver['file'] = vi.fn().mockReturnValue({ createReadStream: vi.fn() });

		driver.getStream('/path/to/file');

		expect(driver['file']).toHaveBeenCalledWith('/path/to/file');
	});

	test('Returns stream from createReadStream', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockStream = {};

		const mockFile = {
			createReadStream: vi.fn().mockReturnValue(mockStream),
		};

		driver['file'] = vi.fn().mockReturnValue(mockFile);

		const stream = await driver.getStream('/path/to/file');

		expect(stream).toBe(mockStream);
		expect(mockFile.createReadStream).toHaveBeenCalledOnce();
		expect(mockFile.createReadStream).toHaveBeenCalledWith(undefined);
	});

	test('Passes optional range to createReadStream', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockStream = {};

		const mockFile = {
			createReadStream: vi.fn().mockReturnValue(mockStream),
		};

		driver['file'] = vi.fn().mockReturnValue(mockFile);

		await driver.getStream('/path/to/file', { start: 500 });
		expect(mockFile.createReadStream).toHaveBeenCalledWith({ start: 500 });

		await driver.getStream('/path/to/file', { start: 500, end: 1500 });
		expect(mockFile.createReadStream).toHaveBeenCalledWith({ start: 500, end: 1500 });

		await driver.getStream('/path/to/file', { end: 1500 });
		expect(mockFile.createReadStream).toHaveBeenCalledWith({ end: 1500 });
	});
});

describe('#getBuffer', () => {
	test('Gets file reference', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		driver['file'] = vi.fn().mockReturnValue({ download: vi.fn().mockResolvedValue([]) });

		driver.getBuffer('/path/to/file');

		expect(driver['file']).toHaveBeenCalledWith('/path/to/file');
	});

	test('Calls download on file', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockFile = { download: vi.fn().mockResolvedValue([]) };

		driver['file'] = vi.fn().mockReturnValue(mockFile);

		driver.getBuffer('/path/to/file');

		expect(mockFile.download).toHaveBeenCalledOnce();
		expect(mockFile.download).toHaveBeenCalledWith();
	});

	test('Returns buffer from response array', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockBuffer = {};

		const mockFile = { download: vi.fn().mockResolvedValue([mockBuffer]) };

		driver['file'] = vi.fn().mockReturnValue(mockFile);

		const result = await driver.getBuffer('/path/to/file');

		expect(result).toBe(mockBuffer);
	});
});

describe('#getStat', () => {
	test('Gets file reference', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		driver['file'] = vi.fn().mockReturnValue({ getMetadata: vi.fn().mockResolvedValue([{}]) });

		await driver.getStat('/path/to/file');

		expect(driver['file']).toHaveBeenCalledWith('/path/to/file');
	});

	test('Calls getMetadata on file', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockFile = { getMetadata: vi.fn().mockResolvedValue([{}]) };

		driver['file'] = vi.fn().mockReturnValue(mockFile);

		await driver.getStat('/path/to/file');

		expect(mockFile.getMetadata).toHaveBeenCalledOnce();
		expect(mockFile.getMetadata).toHaveBeenCalledWith();
	});

	test('Returns size/updated as size/modified from metadata response', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockSize = 1500;
		const mockDate = new Date(2022, 11, 6, 15, 50, 0, 0);

		const mockFile = {
			getMetadata: vi.fn().mockResolvedValue([
				{
					size: mockSize,
					updated: mockDate,
				},
			]),
		};

		driver['file'] = vi.fn().mockReturnValue(mockFile);

		const result = await driver.getStat('/path/to/file');

		expect(result).toStrictEqual({
			size: mockSize,
			modified: mockDate,
		});
	});
});

describe('#exists', () => {
	test('Gets file reference', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		driver['file'] = vi.fn().mockReturnValue({ exists: vi.fn().mockResolvedValue([true]) });

		driver.exists('/path/to/file');

		expect(driver['file']).toHaveBeenCalledWith('/path/to/file');
	});

	test('Calls exists on file', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockFile = { exists: vi.fn().mockResolvedValue([true]) };

		driver['file'] = vi.fn().mockReturnValue(mockFile);

		driver.exists('/path/to/file');

		expect(mockFile.exists).toHaveBeenCalledOnce();
		expect(mockFile.exists).toHaveBeenCalledWith();
	});

	test('Returns boolean from response array', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockFile = { exists: vi.fn().mockResolvedValue([true]) };

		driver['file'] = vi.fn().mockReturnValue(mockFile);

		const result = await driver.exists('/path/to/file');

		expect(result).toBe(true);
	});
});

describe('#move', () => {
	test('Gets file references', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		driver['file'] = vi.fn().mockReturnValue({ move: vi.fn() });

		await driver.move('/path/to/src', '/path/to/dest');

		expect(driver['file']).toHaveBeenCalledWith('/path/to/src');
		expect(driver['file']).toHaveBeenCalledWith('/path/to/dest');
	});

	test('Passes dest file ref to move function', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockFileSrc = { move: vi.fn() };
		const mockFileDest = {};

		driver['file'] = vi.fn().mockImplementation((path) => {
			if (path === '/path/to/dest') {
				return mockFileDest;
			}

			return mockFileSrc;
		});

		await driver.move('/path/to/src', '/path/to/dest');

		expect(mockFileSrc.move).toHaveBeenCalledWith(mockFileDest);
	});
});

describe('#copy', () => {
	test('Gets file references', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		driver['file'] = vi.fn().mockReturnValue({ copy: vi.fn() });

		await driver.copy('/path/to/src', '/path/to/dest');

		expect(driver['file']).toHaveBeenCalledWith('/path/to/src');
		expect(driver['file']).toHaveBeenCalledWith('/path/to/dest');
	});

	test('Passes dest file ref to copy function', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockFileSrc = { copy: vi.fn() };
		const mockFileDest = {};

		driver['file'] = vi.fn().mockImplementation((path) => {
			if (path === '/path/to/dest') {
				return mockFileDest;
			}

			return mockFileSrc;
		});

		await driver.copy('/path/to/src', '/path/to/dest');

		expect(mockFileSrc.copy).toHaveBeenCalledWith(mockFileDest);
	});
});

describe('#put', () => {
	test('Gets file reference for filepath', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockCreateWriteStream = vi.fn();
		const mockSave = vi.fn();

		const mockFile = vi.fn().mockReturnValue({
			createWriteStream: mockCreateWriteStream,
			save: mockSave,
		});

		driver['fullPath'] = vi.fn().mockReturnValue('/path/to/file.txt');

		driver['bucket'] = {
			file: mockFile,
		} as unknown as Bucket;

		await driver.put('path/to/file.txt', 'file-content');

		expect(mockFile).toHaveBeenCalledWith('/path/to/file.txt');
	});

	test('Pipes read stream to write stream in pipeline when stream is passed', async () => {
		vi.mocked(isReadableStream).mockReturnValue(true);

		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockWriteStream = {};

		const mockCreateWriteStream = vi.fn().mockReturnValue(mockWriteStream);
		const mockSave = vi.fn();

		const mockFile = vi.fn().mockReturnValue({
			createWriteStream: mockCreateWriteStream,
			save: mockSave,
		});

		driver['fullPath'] = vi.fn().mockReturnValue('/path/to/file.txt');

		driver['bucket'] = {
			file: mockFile,
		} as unknown as Bucket;

		await driver.put('path/to/file.txt', 'file-content');

		expect(mockCreateWriteStream).toHaveBeenCalledWith({ resumable: false });
		expect(pipeline).toHaveBeenCalledWith('file-content', mockWriteStream);
	});

	test('Saves file using save if contents is buffer/string', async () => {
		vi.mocked(isReadableStream).mockReturnValue(false);

		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockSave = vi.fn();

		const mockFile = vi.fn().mockReturnValue({
			save: mockSave,
		});

		driver['fullPath'] = vi.fn().mockReturnValue('/path/to/file.txt');

		driver['bucket'] = {
			file: mockFile,
		} as unknown as Bucket;

		await driver.put('path/to/file.txt', 'file-content');

		expect(mockSave).toHaveBeenCalledWith('file-content', { resumable: false });
	});
});

describe('#delete', () => {
	test('Gets file reference', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		driver['file'] = vi.fn().mockReturnValue({ delete: vi.fn() });

		await driver.delete('/path/to/file');

		expect(driver['file']).toHaveBeenCalledWith('/path/to/file');
	});

	test('Calls exists on file', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		const mockFile = { delete: vi.fn() };

		driver['file'] = vi.fn().mockReturnValue(mockFile);

		await driver.delete('/path/to/file');

		expect(mockFile.delete).toHaveBeenCalledOnce();
		expect(mockFile.delete).toHaveBeenCalledWith();
	});
});

describe('#list', () => {
	test('Calls getFiles with correct options', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		driver['bucket'] = {
			getFiles: vi.fn().mockResolvedValue([[], undefined]),
		} as unknown as Bucket;

		driver['fullPath'] = vi.fn().mockReturnValue('/root/');

		await driver.list().next();

		expect(driver['bucket'].getFiles).toHaveBeenCalledWith({
			prefix: '/root/',
			autoPaginate: false,
			maxResults: 500,
		});
	});

	test('Yields all paginated files', async () => {
		const driver = new DriverGCS({
			bucket: 'test-bucket',
		});

		driver['bucket'] = {
			getFiles: vi
				.fn()
				.mockResolvedValueOnce([[{ name: 'path-1' }], {}])
				.mockResolvedValueOnce([[{ name: 'path-2' }], undefined]),
		} as unknown as Bucket;

		driver['fullPath'] = vi.fn().mockReturnValue('/root/');

		const output = [];

		for await (const filepath of driver.list()) {
			output.push(filepath);
		}

		expect(output).toStrictEqual(['path-1', 'path-2']);
	});
});
