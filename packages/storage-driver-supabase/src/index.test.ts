import { basename, dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import {
	randAlphaNumeric,
	randGitBranch as randBucket,
	randDirectoryPath,
	randDomainName,
	randFileName,
	randFilePath,
	randFileType,
	randNumber,
	randPastDate,
	randText,
	randGitShortSha as randUnique,
} from '@ngneat/falso';
import { StorageClient } from '@supabase/storage-js';
import { fetch, Response } from 'undici';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { DriverSupabaseConfig } from './index.js';
import { DriverSupabase } from './index.js';

vi.mock('@supabase/storage-js');
vi.mock('undici');

let sample: {
	config: Required<DriverSupabaseConfig>;
	path: {
		input: string;
		src: string;
		dest: string;
	};
	range: {
		start: number;
		end: number;
	};
	stream: Readable;
	text: string;
	file: {
		type: string;
		size: number;
		modified: Date;
	};
};

let driver: DriverSupabase;

beforeEach(() => {
	sample = {
		config: {
			serviceRole: randAlphaNumeric({ length: 40 }).join(''),
			bucket: randBucket(),
			projectId: randAlphaNumeric({ length: 10 }).join(''),
			root: randUnique() + randDirectoryPath(),
			endpoint: randDomainName(),
			tus: { chunkSize: 1024 * 1024 },
		},
		path: {
			input: randUnique() + randFilePath(),
			src: randUnique() + randFilePath(),
			dest: randUnique() + randFilePath(),
		},
		range: {
			start: randNumber(),
			end: randNumber(),
		},
		stream: new Readable(),
		text: randText(),
		file: {
			type: randFileType(),
			size: randNumber(),
			modified: randPastDate(),
		},
	};

	driver = new DriverSupabase({
		serviceRole: sample.config.serviceRole,
		bucket: sample.config.bucket,
		projectId: sample.config.projectId,
	});
});

afterEach(() => {
	vi.resetAllMocks();
});

describe('#constructor', () => {
	let getClientBackup: (typeof DriverSupabase.prototype)['getClient'];
	let getBucketBackup: (typeof DriverSupabase.prototype)['getBucket'];
	let sampleClient: StorageClient;
	let sampleBucket: ReturnType<StorageClient['from']>;

	beforeEach(() => {
		getClientBackup = DriverSupabase.prototype['getClient'];
		sampleClient = {} as StorageClient;
		DriverSupabase.prototype['getClient'] = vi.fn().mockReturnValue(sampleClient);

		getBucketBackup = DriverSupabase.prototype['getBucket'];
		sampleBucket = {} as ReturnType<StorageClient['from']>;
		DriverSupabase.prototype['getBucket'] = vi.fn().mockReturnValue(sampleBucket);
	});

	afterEach(() => {
		DriverSupabase.prototype['getClient'] = getClientBackup;
		DriverSupabase.prototype['getBucket'] = getBucketBackup;
	});

	test('Saves passed config to local property', () => {
		const driver = new DriverSupabase(sample.config);

		expect(driver['config']).toStrictEqual(sample.config);
	});

	test('Creates shared client', () => {
		const driver = new DriverSupabase(sample.config);
		expect(driver['getClient']).toHaveBeenCalledOnce();
		expect(driver['client']).toBe(sampleClient);
	});

	test('Defaults root to empty string', () => {
		expect(driver['config'].root).toBe('');
	});
});

describe('#getClient', () => {
	test('Throws error if serviceRole is missing', () => {
		try {
			new DriverSupabase({ bucket: 'bucket' } as any);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe('`project_id` or `endpoint` is required');
		}
	});

	test('Throws error if bucket missing', () => {
		try {
			new DriverSupabase({ serviceRole: 'key' } as any);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe('`project_id` or `endpoint` is required');
		}
	});

	test('Throws error if projectId and endpoint are both missing', () => {
		try {
			new DriverSupabase({ serviceRole: 'secret', bucket: 'bucket' });
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe('`project_id` or `endpoint` is required');
		}
	});

	test('Is valid if projectId is given', () => {
		const projectId = 'project';
		const driver = new DriverSupabase({ serviceRole: 'secret', bucket: 'bucket', projectId });
		expect(driver).toBeInstanceOf(DriverSupabase);
		expect(driver['endpoint']).toEqual(`https://${projectId}.supabase.co/storage/v1`);
	});

	test('Is valid if endpoint is given', () => {
		const endpoint = 'https://example.com';
		const driver = new DriverSupabase({ serviceRole: 'secret', bucket: 'bucket', endpoint });
		expect(driver).toBeInstanceOf(DriverSupabase);
		expect(driver['endpoint']).toEqual(endpoint);
	});

	test('Creates storage client', () => {
		expect(StorageClient).toHaveBeenCalledWith(`https://${sample.config.projectId}.supabase.co/storage/v1`, {
			apikey: sample.config.serviceRole,
			Authorization: `Bearer ${sample.config.serviceRole}`,
		});

		expect(driver['client']).toBeInstanceOf(StorageClient);
	});
});

describe('#fullPath', () => {
	test('Returns the input value if no root is given', () => {
		const driver = new DriverSupabase({
			serviceRole: sample.config.serviceRole,
			bucket: sample.config.bucket,
			endpoint: sample.config.endpoint,
		});

		const result = driver['fullPath'](sample.path.input);
		expect(result).toBe(sample.path.input);
	});

	test('Returns normalized joined path', () => {
		const driver = new DriverSupabase({
			serviceRole: sample.config.serviceRole,
			bucket: sample.config.bucket,
			endpoint: sample.config.endpoint,
			root: sample.config.root,
		});

		const result = driver['fullPath'](sample.path.input);
		expect(result).toBe(`${sample.config.root}/${sample.path.input}`);
	});
});

describe('#getAuthenticatedUrl', () => {
	test('Returns the url for an object with no root that requires authentication', () => {
		const driver = new DriverSupabase({
			serviceRole: 'serviceRole',
			bucket: 'bucket',
			projectId: 'projectId',
		});

		const result = driver['getAuthenticatedUrl']('testing.png');

		expect(result).toBe('https://projectId.supabase.co/storage/v1/object/authenticated/bucket/testing.png');
	});

	test('Returns the url for an object that requires authentication', () => {
		const driver = new DriverSupabase({
			serviceRole: 'serviceRole',
			bucket: 'bucket',
			projectId: 'projectId',
			root: 'testing',
		});

		const result = driver['getAuthenticatedUrl']('testing.png');

		expect(result).toBe('https://projectId.supabase.co/storage/v1/object/authenticated/bucket/testing/testing.png');
	});
});

describe('#read', () => {
	let rootEndpoint: string;
	let endpoint: string;

	beforeEach(() => {
		rootEndpoint = `https://projectId.supabase.co/storage/v1/object/authenticated/bucket/testing/${sample.path.input}.png`;
		endpoint = `https://projectId.supabase.co/storage/v1/object/authenticated/bucket/${sample.path.input}.png`;
		vi.mocked(fetch).mockReturnValue({ status: 200, body: new ReadableStream() } as unknown as Promise<Response>);
		driver['getAuthenticatedUrl'] = vi.fn().mockReturnValue(endpoint);
	});

	test('Uses getAuthenticatedUrl to get endpoint when no root is set', async () => {
		await driver.read(sample.path.input);

		expect(driver['getAuthenticatedUrl']).toHaveBeenCalledWith(sample.path.input);

		expect(fetch).toHaveBeenCalledWith(endpoint, {
			headers: {
				Authorization: `Bearer ${sample.config.serviceRole}`,
			},
			method: 'GET',
		});
	});

	test('Uses getAuthenticatedUrl to get endpoint when a root is set', async () => {
		driver['getAuthenticatedUrl'] = vi.fn().mockReturnValue(rootEndpoint);

		await driver.read(sample.path.input);

		expect(driver['getAuthenticatedUrl']).toHaveBeenCalledWith(sample.path.input);

		expect(fetch).toHaveBeenCalledWith(rootEndpoint, {
			headers: {
				Authorization: `Bearer ${sample.config.serviceRole}`,
			},
			method: 'GET',
		});
	});

	test('Optionally allows setting start range offset', async () => {
		await driver.read(sample.path.input, { range: { start: sample.range.start } } as any);

		expect(fetch).toHaveBeenCalledWith(endpoint, {
			headers: {
				Authorization: `Bearer ${sample.config.serviceRole}`,
				Range: `bytes=${sample.range.start}-`,
			},
			method: 'GET',
		});
	});

	test('Optionally allows setting end range offset', async () => {
		await driver.read(sample.path.input, { range: { end: sample.range.end } } as any);

		expect(fetch).toHaveBeenCalledWith(endpoint, {
			headers: {
				Authorization: `Bearer ${sample.config.serviceRole}`,
				Range: `bytes=-${sample.range.end}`,
			},
			method: 'GET',
		});
	});

	test('Optionally allows setting start and end range offset', async () => {
		await driver.read(sample.path.input, { range: sample.range });

		expect(fetch).toHaveBeenCalledWith(endpoint, {
			headers: {
				Authorization: `Bearer ${sample.config.serviceRole}`,
				Range: `bytes=${sample.range.start}-${sample.range.end}`,
			},
			method: 'GET',
		});
	});

	test('Throws an error when no stream is returned', async () => {
		vi.mocked(fetch).mockReturnValue({ status: 400, body: new ReadableStream() } as unknown as Promise<Response>);

		try {
			await driver.read(sample.path.input, { range: sample.range });
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`No stream returned for file "${sample.path.input}"`);
		}
	});

	test('Throws an error when returned stream is not a readable stream', async () => {
		vi.mocked(fetch).mockReturnValue({ status: 200, body: undefined } as unknown as Promise<Response>);

		expect(driver.read(sample.path.input, { range: sample.range })).rejects.toThrowError(
			new Error(`No stream returned for file "${sample.path.input}"`),
		);
	});

	test('Returns stream', async () => {
		const stream = await driver.read(sample.path.input, { range: sample.range });

		expect(fetch).toHaveBeenCalledWith(endpoint, {
			headers: {
				Authorization: `Bearer ${sample.config.serviceRole}`,
				Range: `bytes=${sample.range.start}-${sample.range.end}`,
			},
			method: 'GET',
		});

		expect(stream).toBeInstanceOf(Readable);
	});
});

describe('#stat', () => {
	test('Returns the size/modified from metadata', async () => {
		driver['bucket'] = {
			list: vi.fn().mockReturnValue({
				data: [{ metadata: { contentLength: sample.file.size, lastModified: sample.file.modified } }],
				error: null,
			}),
		} as any;

		const stat = await driver.stat(sample.path.input);

		expect(stat).toEqual({
			size: sample.file.size,
			modified: sample.file.modified,
		});

		expect(driver['bucket'].list).toHaveBeenCalledWith(dirname(sample.path.input), {
			limit: 1,
			search: basename(sample.path.input),
		});
	});

	test('Uses the configured root directory', async () => {
		driver['config'].root = 'root';

		driver['bucket'] = {
			list: vi.fn().mockReturnValue({
				data: [{ metadata: { contentLength: sample.file.size, lastModified: sample.file.modified } }],
				error: null,
			}),
		} as any;

		const stat = await driver.stat(sample.path.input);

		expect(stat).toEqual({
			size: sample.file.size,
			modified: sample.file.modified,
		});

		expect(driver['bucket'].list).toHaveBeenCalledWith(join('root', dirname(sample.path.input)), {
			limit: 1,
			search: basename(sample.path.input),
		});
	});

	test('Uses empty string instead of "." when root is the empty string', async () => {
		const filename = 'test.png';

		driver['bucket'] = {
			list: vi.fn().mockReturnValue({
				data: [{ metadata: { contentLength: sample.file.size, lastModified: sample.file.modified } }],
				error: null,
			}),
		} as any;

		await driver.stat(filename);

		expect(driver['bucket'].list).toHaveBeenCalledWith('', {
			limit: 1,
			search: filename,
		});
	});

	test('Throws an error no file is returned by list', async () => {
		driver['bucket'] = {
			list: vi.fn().mockReturnValue({
				data: [],
				error: null,
			}),
		} as any;

		expect(driver.stat(sample.path.input)).rejects.toThrowError(new Error(`File not found`));
	});

	test('Throws an error if storage error is returned', async () => {
		driver['bucket'] = {
			list: vi.fn().mockReturnValue({
				data: null,
				error: true,
			}),
		} as any;

		expect(driver.stat(sample.path.input)).rejects.toThrowError(new Error(`File not found`));
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
	test('passes arguments to move', async () => {
		driver['bucket'] = {
			move: vi.fn(),
		} as any;

		await driver.move(sample.path.input, 'new/path');
		expect(driver['bucket'].move).toHaveBeenCalledWith(sample.path.input, 'new/path');
	});
});

describe('#copy', () => {
	test('passes arguments to copy', async () => {
		driver['bucket'] = {
			copy: vi.fn(),
		} as any;

		await driver.copy(sample.path.input, 'new/path');
		expect(driver['bucket'].copy).toHaveBeenCalledWith(sample.path.input, 'new/path');
	});
});

describe('#write', () => {
	beforeEach(() => {
		driver['bucket'] = {
			upload: vi.fn().mockResolvedValue({ data: null, error: null }),
		} as any;
	});

	test('Passes streams to body as is', async () => {
		await driver.write(sample.path.input, sample.stream);

		expect(driver['bucket'].upload).toHaveBeenCalledWith(sample.path.input, sample.stream, {
			cacheControl: '3600',
			contentType: '',
			duplex: 'half',
			upsert: true,
		});
	});

	test('Ensures input is passed to fullPath', async () => {
		driver['fullPath'] = vi.fn();

		await driver.write(sample.path.input, sample.stream);
		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
	});

	test('Optionally sets ContentType', async () => {
		await driver.write(sample.path.input, sample.stream, sample.file.type);

		expect(driver['bucket'].upload).toHaveBeenCalledWith(sample.path.input, sample.stream, {
			cacheControl: '3600',
			contentType: sample.file.type,
			duplex: 'half',
			upsert: true,
		});
	});

	test('Throws error when upload fails', async () => {
		const uploadError = new Error('Upload failed');

		driver['bucket'] = {
			upload: vi.fn().mockResolvedValue({ data: null, error: uploadError }),
		} as any;

		await expect(driver.write(sample.path.input, sample.stream)).rejects.toThrow(
			new Error(`Error uploading file "${sample.path.input}"`, { cause: uploadError }),
		);
	});
});

describe('#delete', () => {
	test('Ensures input is passed to fullPath', async () => {
		driver['bucket'] = {
			remove: vi.fn(),
		} as any;

		driver['fullPath'] = vi.fn();

		await driver.delete(sample.path.input);
		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
	});
});

describe('#list', () => {
	test('Constructs list objects params based on input prefix', async () => {
		const sampleFile = randFileName();
		const sampleDirectory = randDirectoryPath();
		const fullSample = `${sampleDirectory}/${sampleFile}`;

		// TODO: Probably a better way to do this?
		driver['bucket'] = {
			list: vi.fn().mockReturnValue({ data: [], error: null }),
		} as any;

		await driver.list(fullSample)[Symbol.asyncIterator]().next();

		expect(driver['bucket'].list).toHaveBeenCalledWith(sampleDirectory, {
			search: sampleFile,
			limit: 1000,
			offset: 0,
		});
	});

	test('Yields file name omitting root if prefix is the full file path', async () => {
		const sampleRoot = randDirectoryPath();
		const sampleFile = randFileName();
		const sampleFull = `${sample.path.input}/${sampleFile}`;

		driver['bucket'] = {
			list: vi.fn().mockResolvedValueOnce({
				data: [
					{
						name: sampleFile,
						id: randUnique(),
					},
				],
				error: null,
			}),
		} as any;

		driver['config'].root = sampleRoot;

		const iterator = driver.list(sampleFull);
		const output: string[] = [];

		for await (const filepath of iterator) {
			output.push(filepath);
		}

		expect(output).toStrictEqual([sampleFull]);
	});

	test('Yields file name omitting root if prefix is the parent directory', async () => {
		const sampleRoot = randDirectoryPath();
		const sampleFile = randFileName();
		const sampleParentDir = randUnique();
		const sampleInput = `${sample.path.input}/${sampleParentDir}`;
		const sampleFull = `${sampleInput}/${sampleFile}`;

		driver['bucket'] = {
			list: vi
				.fn()
				.mockResolvedValueOnce({
					data: [
						{
							name: sampleParentDir,
							id: null,
						},
					],
					error: null,
				})
				.mockResolvedValueOnce({
					data: [
						{
							name: sampleFile,
							id: randUnique(),
						},
					],
					error: null,
				}),
		} as any;

		driver['config'].root = sampleRoot;

		const iterator = driver.list(sampleInput);
		const output: string[] = [];

		for await (const filepath of iterator) {
			output.push(filepath);
		}

		expect(driver['bucket'].list).toHaveBeenCalledTimes(2);
		expect(output).toStrictEqual([sampleFull]);
	});

	test('Yields file name omitting root if prefix is part of the file name', async () => {
		const sampleRoot = randDirectoryPath();
		const sampleFilePrefix = randFileName();
		const sampleFiles = [1, 2, 3].map((i) => `${sampleFilePrefix}_postfix${i}`);
		const sampleInput = `${sample.path.input}/${sampleFilePrefix}`;
		const sampleFilesFull = sampleFiles.map((name) => `${sample.path.input}/${name}`);

		driver['bucket'] = {
			list: vi.fn().mockResolvedValueOnce({
				data: sampleFiles.map((name) => ({
					name,
					id: randUnique(),
				})),
				error: null,
			}),
		} as any;

		driver['config'].root = sampleRoot;

		const iterator = driver.list(sampleInput);
		const output: string[] = [];

		for await (const filepath of iterator) {
			output.push(filepath);
		}

		expect(output).toStrictEqual(sampleFilesFull);
	});

	test('Recursively fetches all nested directories and yields only the files', async () => {
		const sampleRoot = randUnique() + randDirectoryPath();
		const samplePrefixBase = randUnique() + randDirectoryPath();
		const samplePrefixLastDir = randUnique();
		const samplePrefix = `${samplePrefixBase}/${samplePrefixLastDir}`;

		/*
		sampleFile
		sampleDirectory/
		├─ sampleFileNested
		 */
		const sampleDirectory = randUnique();
		const sampleFile = randFileName();
		const sampleFileNested = randFileName();

		const fullSampleDirectory = `${samplePrefix}/${sampleDirectory}`;
		const fullSampleFile = `${samplePrefix}/${sampleFile}`;
		const fullSampleFileNested = `${fullSampleDirectory}/${sampleFileNested}`;

		driver['bucket'] = {
			list: vi.fn(async (path, options): Promise<any> => {
				// query for parent dir, return the contained dir
				if (path === `${sampleRoot}/${samplePrefixBase}` && options?.search === samplePrefixLastDir)
					return { data: [{ name: samplePrefixLastDir, id: null }], error: null };
				// query for the contents of the samplePrefix, return file and directory
				if (path === `${sampleRoot}/${samplePrefix}/` && options?.search === '')
					return {
						data: [
							{ name: sampleDirectory, id: null },
							{ name: sampleFile, id: randUnique() },
						],
						error: null,
					};
				// query for the contents of the sampleDirectory, return the nested file
				if (path === `${sampleRoot}/${fullSampleDirectory}/` && options?.search === '')
					return {
						data: [{ name: sampleFileNested, id: randUnique() }],
						error: null,
					};
				throw Error();
			}),
		} as any;

		driver['config'].root = sampleRoot;

		const iterator = driver.list(samplePrefix);
		const output: string[] = [];

		for await (const filepath of iterator) {
			output.push(filepath);
		}

		expect(driver['bucket'].list).toHaveBeenCalledTimes(3);
		expect(output).toStrictEqual([fullSampleFileNested, fullSampleFile]);
	});

	test('Continuously fetches until all pages are returned', async () => {
		const firstContents = Array.from({ length: 1000 }, () => ({ name: randFilePath() }));
		const secondContents = Array.from({ length: 256 }, () => ({ name: randFilePath() }));

		// TODO: Probably a better way to do this?
		driver['bucket'] = {
			list: vi
				.fn()
				.mockResolvedValueOnce({
					data: firstContents,
					error: null,
				})
				.mockResolvedValueOnce({
					data: secondContents,
					error: null,
				}),
		} as any;

		const iterator = driver.list(sample.path.input);

		const output: string[] = [];

		for await (const filepath of iterator) {
			output.push(filepath);
		}

		expect(output.length).toBe(1256);
	});
});
