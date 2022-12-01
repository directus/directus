import type { WriteStream } from 'node:fs';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, copyFile, mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DriverLocal } from './index.js';

vi.mock('node:path');
vi.mock('node:fs');
vi.mock('node:fs/promises');
vi.mock('node:stream/promises');

afterEach(() => {
	vi.clearAllMocks();
});

describe('#constructor', () => {
	test('Resolves root based on input', () => {
		new DriverLocal({ root: '/test-root/' });
		expect(resolve).toHaveBeenCalledWith('/test-root/');
	});

	test('Saves resolved path to private var root', () => {
		vi.mocked(resolve).mockReturnValueOnce('/resolved/test-root/');
		const driver = new DriverLocal({ root: '/test-root/' });
		expect(driver['root']).toBe('/resolved/test-root/');
	});
});

describe('#getFullPath', () => {
	test('Joins passed filepath with system separator', () => {
		const driver = new DriverLocal({ root: '' });
		driver['getFullPath']('/test/filepath/');
		expect(join).toHaveBeenCalledWith(sep, '/test/filepath/');
	});

	test('Joins config root with sep prefixed filepath', () => {
		vi.mocked(join).mockReturnValueOnce('/test/filepath').mockReturnValueOnce('/root/test/filepath');

		const driver = new DriverLocal({ root: '/root/' });

		const filepath = driver['getFullPath']('/test/filepath/');

		expect(join).toHaveBeenCalledTimes(2);
		expect(filepath).toBe('/root/test/filepath');
	});
});

describe('#ensureDir', () => {
	test('Calls node:fs/promises mkdir with passed path', async () => {
		const driver = new DriverLocal({ root: '/' });
		await driver['ensureDir']('/directory/path');
		expect(mkdir).toHaveBeenCalledWith('/directory/path', { recursive: true });
	});
});

describe('#getStream', () => {
	test('Calls createReadStream with full path', () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');

		driver.getStream('/path');

		expect(driver['getFullPath']).toHaveBeenCalledWith('/path');
		expect(createReadStream).toHaveBeenCalledWith('/full/path/', {});
	});

	test('Calls createReadStream with optional start range', () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');

		driver.getStream('/path', { start: 500 });

		expect(createReadStream).toHaveBeenCalledWith('/full/path/', { start: 500 });
	});

	test('Calls createReadStream with optional end range', () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');

		driver.getStream('/path', { end: 1500 });

		expect(createReadStream).toHaveBeenCalledWith('/full/path/', { end: 1500 });
	});

	test('Calls createReadStream with optional start and end range', () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');

		driver.getStream('/path', { start: 500, end: 1500 });

		expect(createReadStream).toHaveBeenCalledWith('/full/path/', { start: 500, end: 1500 });
	});
});

describe('#getBuffer', () => {
	test('Calls node:fs/promises readFile with full path', async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');

		await driver.getBuffer('/path/to/file');

		expect(driver['getFullPath']).toHaveBeenCalledWith('/path/to/file');
		expect(readFile).toHaveBeenCalledWith('/full/path/');
	});
});

describe('#getStat', () => {
	test('Calls node:fs/promises stat with full path', async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');
		vi.mocked(stat).mockResolvedValueOnce({} as unknown as Awaited<ReturnType<typeof stat>>);

		await driver.getStat('/filepath');

		expect(driver['getFullPath']).toHaveBeenCalledWith('/filepath');
		expect(stat).toHaveBeenCalledWith('/full/path/');
	});

	test(`Throws error if stat does not return info`, async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');

		expect(driver.getStat('/filepath')).rejects.toThrowErrorMatchingInlineSnapshot(
			`"File \\"/filepath\\" doesn't exist."`
		);

		expect(driver['getFullPath']).toHaveBeenCalledWith('/filepath');
		expect(stat).toHaveBeenCalledWith('/full/path/');
	});
});

describe('#exists', () => {
	test('Calls node:fs/promises access with full path', async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');
		vi.mocked(access).mockResolvedValueOnce({} as unknown as Awaited<ReturnType<typeof access>>);

		await driver.exists('/filepath');

		expect(driver['getFullPath']).toHaveBeenCalledWith('/filepath');
		expect(access).toHaveBeenCalledWith('/full/path/');
	});

	test(`Returns true if access resolves`, async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');
		vi.mocked(access).mockResolvedValueOnce({} as unknown as Awaited<ReturnType<typeof access>>);

		const result = await driver.exists('/filepath');
		expect(result).toBe(true);
	});

	test(`Returns false if access rejects`, async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');
		vi.mocked(access).mockRejectedValueOnce(null);
		const result = await driver.exists('/filepath');
		expect(result).toBe(false);
	});
});

describe('#move', () => {
	test('Makes sure destination location exists', async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValueOnce('/full/src/').mockReturnValueOnce('/full/dest/file.jpg');
		driver['ensureDir'] = vi.fn().mockReturnValue(undefined);
		vi.mocked(dirname).mockReturnValueOnce('/full/dest/');

		await driver.move('/src', '/dest');

		expect(dirname).toHaveBeenCalledWith('/full/dest/file.jpg');
		expect(driver['ensureDir']).toHaveBeenCalledWith('/full/dest/');
	});

	test('Calls node:fs/promises with full path for both src and dest', async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValueOnce('/full/src/').mockReturnValueOnce('/full/dest/');

		await driver.move('/src', '/dest');

		expect(driver['getFullPath']).toHaveBeenCalledWith('/src');
		expect(driver['getFullPath']).toHaveBeenCalledWith('/dest');
		expect(rename).toHaveBeenCalledWith('/full/src/', '/full/dest/');
	});
});

describe('#copy', () => {
	test('Makes sure destination location exists', async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValueOnce('/full/src/').mockReturnValueOnce('/full/dest/file.jpg');
		driver['ensureDir'] = vi.fn().mockReturnValue(undefined);
		vi.mocked(dirname).mockReturnValueOnce('/full/dest/');

		await driver.copy('/src', '/dest');

		expect(dirname).toHaveBeenCalledWith('/full/dest/file.jpg');
		expect(driver['ensureDir']).toHaveBeenCalledWith('/full/dest/');
	});

	test('Calls node:fs/promises copyFile with full path for both src and dest', async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValueOnce('/full/src/').mockReturnValueOnce('/full/dest/');

		await driver.copy('/src', '/dest');

		expect(driver['getFullPath']).toHaveBeenCalledWith('/src');
		expect(driver['getFullPath']).toHaveBeenCalledWith('/dest');
		expect(copyFile).toHaveBeenCalledWith('/full/src/', '/full/dest/');
	});
});

describe('#put', () => {
	test('Makes sure destination location exists', async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValueOnce('/full/path/to/file.txt');
		driver['ensureDir'] = vi.fn().mockReturnValue(undefined);
		vi.mocked(dirname).mockReturnValueOnce('/full/path/to/');

		await driver.put('/path/to/file.txt', 'file contents');

		expect(dirname).toHaveBeenCalledWith('/full/path/to/file.txt');
		expect(driver['ensureDir']).toHaveBeenCalledWith('/full/path/to/');
	});

	test('Creates write stream to file path when a readstream is passed', async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValueOnce('/full/path/to/file.txt');

		const mockStream = new Readable();

		await driver.put('/path/to/file.txt', mockStream);

		expect(createWriteStream).toHaveBeenCalledWith('/full/path/to/file.txt');
	});

	test('Passes read stream to write stream in pipeline', async () => {
		const mockReadStream = new Readable();
		const mockWriteStream = {};

		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValueOnce('/full/path/to/file.txt');

		vi.mocked(createWriteStream).mockReturnValueOnce(mockWriteStream as unknown as WriteStream);

		await driver.put('/path/to/file.txt', mockReadStream);

		expect(pipeline).toHaveBeenCalledWith(mockReadStream, mockWriteStream);
	});

	test('Calls writeFile with passed content if not a stream', async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValueOnce('/full/path/to/file.txt');

		await driver.put('/path/to/file.txt', 'text file contents');

		expect(writeFile).toHaveBeenCalledWith('/full/path/to/file.txt', 'text file contents');
	});
});
