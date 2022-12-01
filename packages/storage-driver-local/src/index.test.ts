import { expect, test, describe, vi, afterEach } from 'vitest';
import { DriverLocal } from './index.js';
import { join, resolve, sep } from 'node:path';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';

vi.mock('node:path');
vi.mock('node:fs');
vi.mock('node:fs/promises');

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
	test('Calls node:fs/promises stat with full path', async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');
		vi.mocked(stat).mockResolvedValueOnce({} as unknown as Awaited<ReturnType<typeof stat>>);

		await driver.exists('/filepath');

		expect(driver['getFullPath']).toHaveBeenCalledWith('/filepath');
		expect(stat).toHaveBeenCalledWith('/full/path/');
	});

	test(`Returns false if stat returns undefined or false`, async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');
		vi.mocked(stat).mockResolvedValueOnce(undefined as unknown as Awaited<ReturnType<typeof stat>>);

		const result = await driver.exists('/filepath');
		expect(result).toBe(false);
	});

	test(`Returns true if stat returns an object`, async () => {
		const driver = new DriverLocal({ root: '/' });
		driver['getFullPath'] = vi.fn().mockReturnValue('/full/path/');
		vi.mocked(stat).mockResolvedValueOnce({} as unknown as Awaited<ReturnType<typeof stat>>);

		const result = await driver.exists('/filepath');
		expect(result).toBe(true);
	});
});
