import {
	randDirectoryPath,
	randFilePath,
	randFileType,
	randNumber,
	randPastDate,
	randText,
	randWord,
	randGitShortSha as randUnique,
} from '@ngneat/falso';
import type { Dir, WriteStream } from 'node:fs';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, copyFile, mkdir, opendir, rename, stat, unlink } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { PassThrough } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { DriverLocalConfig } from './index.js';
import { DriverLocal } from './index.js';

vi.mock('node:path');
vi.mock('node:fs');
vi.mock('node:fs/promises');
vi.mock('node:stream/promises');

let sample: {
	config: Required<DriverLocalConfig>;
	path: {
		root: string;
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
	text: string;
	stream: PassThrough;
	file: {
		type: string;
		size: number;
		modified: Date;
	};
};

let driver: DriverLocal;

beforeEach(() => {
	sample = {
		config: {
			root: randDirectoryPath(),
		},
		path: {
			root: randUnique() + randDirectoryPath(),
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
		text: randText(),
		stream: new PassThrough(),
		file: {
			type: randFileType(),
			size: randNumber(),
			modified: randPastDate(),
		},
	};

	driver = new DriverLocal({ root: sample.config.root });

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
	test('Resolves root based on input', () => {
		expect(resolve).toHaveBeenCalledWith(sample.config.root);
	});

	test('Saves resolved path to private var root', () => {
		const mockResolved = randDirectoryPath();
		vi.mocked(resolve).mockReturnValueOnce(mockResolved);
		const driver = new DriverLocal({ root: sample.config.root });
		expect(driver['root']).toBe(mockResolved);
	});
});

describe('#fullPath', () => {
	beforeEach(() => {
		vi.mocked(driver['fullPath']).mockRestore();
	});

	test('Joins passed filepath with system separator', () => {
		const driver = new DriverLocal({ root: sample.config.root });

		driver['fullPath'](sample.path.input);

		expect(join).toHaveBeenCalledWith(sep, sample.path.input);
	});

	test('Joins config root with sep prefixed filepath', () => {
		const driver = new DriverLocal({ root: sample.path.root });
		vi.mocked(join).mockReturnValueOnce(sample.path.input).mockReturnValueOnce(sample.path.inputFull);
		driver['root'] = sample.path.root;

		const filepath = driver['fullPath'](sample.path.input);

		expect(join).toHaveBeenCalledTimes(2);
		expect(filepath).toBe(sample.path.inputFull);
	});
});

describe('#ensureDir', () => {
	test('Calls node:fs/promises mkdir with passed path', async () => {
		await driver['ensureDir'](sample.path.input);
		expect(mkdir).toHaveBeenCalledWith(sample.path.input, { recursive: true });
	});
});

describe('#read', () => {
	test('Calls createReadStream with full path', async () => {
		await driver.read(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(createReadStream).toHaveBeenCalledWith(sample.path.inputFull, {});
	});

	test('Calls createReadStream with optional start range', async () => {
		await driver.read(sample.path.input, { start: sample.range.start });

		expect(createReadStream).toHaveBeenCalledWith(sample.path.inputFull, { start: sample.range.start });
	});

	test('Calls createReadStream with optional end range', async () => {
		await driver.read(sample.path.input, { end: sample.range.end });

		expect(createReadStream).toHaveBeenCalledWith(sample.path.inputFull, { end: sample.range.end });
	});

	test('Calls createReadStream with optional start and end range', async () => {
		await driver.read(sample.path.input, sample.range);

		expect(createReadStream).toHaveBeenCalledWith(sample.path.inputFull, sample.range);
	});
});

describe('#stat', () => {
	test('Calls node:fs/promises stat with full path', async () => {
		vi.mocked(stat).mockResolvedValueOnce({} as unknown as Awaited<ReturnType<typeof stat>>);

		await driver.stat(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(stat).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test(`Throws error if stat does not return info`, async () => {
		try {
			await driver.stat(sample.path.input);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`File "${sample.path.input}" doesn't exist.`);
		}
	});
});

describe('#exists', () => {
	test('Calls node:fs/promises access with full path', async () => {
		vi.mocked(access).mockResolvedValueOnce({} as unknown as Awaited<ReturnType<typeof access>>);

		await driver.exists(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(access).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test('Returns true if access resolves', async () => {
		vi.mocked(access).mockResolvedValueOnce({} as unknown as Awaited<ReturnType<typeof access>>);

		const result = await driver.exists(sample.path.input);

		expect(result).toBe(true);
	});

	test('Returns false if access rejects', async () => {
		vi.mocked(access).mockRejectedValueOnce(null);

		const result = await driver.exists(sample.path.input);

		expect(result).toBe(false);
	});
});

describe('#move', () => {
	beforeEach(() => {
		driver['ensureDir'] = vi.fn();
	});

	test('Makes sure destination location exists', async () => {
		const mockDirname = randDirectoryPath();
		vi.mocked(dirname).mockReturnValueOnce(mockDirname);

		await driver.move(sample.path.src, sample.path.dest);

		expect(dirname).toHaveBeenCalledWith(sample.path.destFull);
		expect(driver['ensureDir']).toHaveBeenCalledWith(mockDirname);
	});

	test('Calls node:fs/promises with full path for both src and dest', async () => {
		await driver.move(sample.path.src, sample.path.dest);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.src);
		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.dest);
		expect(rename).toHaveBeenCalledWith(sample.path.srcFull, sample.path.destFull);
	});
});

describe('#copy', () => {
	beforeEach(() => {
		driver['ensureDir'] = vi.fn();
	});

	test('Makes sure destination location exists', async () => {
		const mockDirname = randDirectoryPath();
		vi.mocked(dirname).mockReturnValueOnce(mockDirname);

		await driver.copy(sample.path.src, sample.path.dest);

		expect(dirname).toHaveBeenCalledWith(sample.path.destFull);
		expect(driver['ensureDir']).toHaveBeenCalledWith(mockDirname);
	});

	test('Calls node:fs/promises copyFile with full path for both src and dest', async () => {
		await driver.copy(sample.path.src, sample.path.dest);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.src);
		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.dest);
		expect(copyFile).toHaveBeenCalledWith(sample.path.srcFull, sample.path.destFull);
	});
});

describe('#write', () => {
	beforeEach(() => {
		driver['ensureDir'] = vi.fn();
	});

	test('Makes sure destination location exists', async () => {
		const mockDirname = randDirectoryPath();
		vi.mocked(dirname).mockReturnValueOnce(mockDirname);

		await driver.write(sample.path.input, sample.stream);

		expect(dirname).toHaveBeenCalledWith(sample.path.inputFull);
		expect(driver['ensureDir']).toHaveBeenCalledWith(mockDirname);
	});

	test('Creates write stream to file path when a readstream is passed', async () => {
		await driver.write(sample.path.input, sample.stream);

		expect(createWriteStream).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test('Passes read stream to write stream in pipeline', async () => {
		const mockWriteStream = {};
		vi.mocked(createWriteStream).mockReturnValueOnce(mockWriteStream as unknown as WriteStream);

		await driver.write(sample.path.input, sample.stream);

		expect(pipeline).toHaveBeenCalledWith(sample.stream, mockWriteStream);
	});
});

describe('#delete', () => {
	test('Calls node:fs/promises unlink with full filepath', async () => {
		await driver.delete(sample.path.input);

		expect(unlink).toHaveBeenCalledWith(sample.path.inputFull);
	});
});

describe('#list', () => {
	test('Returns iterable listGenerator with full prefix', () => {
		driver.list(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
	});
});

describe('#listGenerator', () => {
	let mockFiles: string[];

	beforeEach(() => {
		mockFiles = randFilePath({ length: 3 });

		vi.mocked(opendir).mockResolvedValue(
			(function* () {
				for (const mockFile of mockFiles) {
					yield { name: mockFile, isFile: () => true, isDirectory: () => false };
				}
			})() as unknown as Dir
		);

		vi.mocked(join).mockImplementation((_, filepath) => filepath);
	});

	test('Opens directory if directory is passed', async () => {
		const mockFolder = `${randDirectoryPath()}/`;

		const iterator = driver['listGenerator'](mockFolder);
		await iterator.next();

		expect(opendir).toHaveBeenCalledWith(mockFolder);
	});

	test('Opens directory if file or string prefix is passed', async () => {
		const mockRoot = `/${randWord()}/`;
		const mockPrefix = randWord();

		vi.mocked(dirname).mockReturnValueOnce(mockRoot);

		const iterator = driver['listGenerator'](`${mockRoot}${mockPrefix}`);
		await iterator.next();

		expect(dirname).toHaveBeenCalledWith(`${mockRoot}${mockPrefix}`);
		expect(opendir).toHaveBeenCalledWith(mockRoot);
	});

	test('Ignores files that do not start with the prefix', async () => {
		vi.mocked(opendir).mockResolvedValue(
			(function* () {
				for (const mockFile of mockFiles) {
					yield { name: `/right-prefix/${mockFile}`, isFile: () => true, isDirectory: () => false };
				}
			})() as unknown as Dir
		);

		vi.mocked(join).mockImplementation((_, filepath) => filepath);

		const iterator = driver['listGenerator'](`/wrong-prefix/${mockFiles[0]}`);
		const output = await iterator.next();

		expect(output).toStrictEqual({
			done: true,
			value: undefined,
		});
	});

	test('Returns filepath string relative from configured root if path is file', async () => {
		vi.mocked(relative).mockImplementation((_, x) => x);

		const iterator = driver['listGenerator']('');

		const output = [];

		for await (const filename of iterator) {
			output.push(filename);
		}

		expect(output).toStrictEqual(mockFiles);
	});

	test('Recursively calls itself to traverse directories', async () => {
		vi.mocked(relative).mockImplementation((_, x) => x);

		const mockDirectory = randDirectoryPath();
		const mockFile = randFilePath();

		vi.mocked(opendir).mockReset();

		vi.mocked(opendir).mockResolvedValueOnce(
			(function* () {
				yield { name: mockDirectory, isFile: () => false, isDirectory: () => true };
			})() as unknown as Dir
		);

		// Nested second call
		vi.mocked(opendir).mockResolvedValueOnce(
			(function* () {
				yield { name: mockFile, isFile: () => true, isDirectory: () => false };
			})() as unknown as Dir
		);

		const iterator = driver['listGenerator']('');

		const output = [];

		for await (const filename of iterator) {
			output.push(filename);
		}

		expect(output).toStrictEqual([mockFile]);
	});
});
