import { expect, test, describe, vi, afterEach } from 'vitest';
import { DriverLocal } from './index.js';
import { join, resolve, sep } from 'node:path';
import { createReadStream } from 'node:fs';

vi.mock('node:path');
vi.mock('node:fs');

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
