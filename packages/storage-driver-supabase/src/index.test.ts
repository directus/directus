import { StorageClient } from '@supabase/storage-js';
import {
	randAlphaNumeric,
	randGitBranch as randBucket,
	randDirectoryPath,
	randDomainName,
	randFilePath,
	randFileType,
	randNumber,
	randPastDate,
	randText,
	randGitShortSha as randUnique,
} from '@ngneat/falso';
import { Response, fetch } from 'undici';
import { Readable } from 'node:stream';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { DriverSupabaseConfig } from './index.js';
import { DriverSupabase } from './index.js';
import { ReadableStream } from 'node:stream/web';

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
			root: randDirectoryPath(),
			endpoint: randDomainName(),
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
		expect(driver['config']).toBe(sample.config);
	});

	test('Creates shared client', () => {
		const driver = new DriverSupabase(sample.config);
		expect(driver['getClient']).toHaveBeenCalledOnce();
		expect(driver['client']).toBe(sampleClient);
	});

	test('Defaults root to empty string', () => {
		expect(driver['config'].root).toBe(undefined);
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

describe('#getFullPath', () => {
	test('Returns the input value if no root is given', () => {
		const driver = new DriverSupabase({
			serviceRole: sample.config.serviceRole,
			bucket: sample.config.bucket,
			endpoint: sample.config.endpoint,
		});

		const result = driver['getFullPath'](sample.path.input);
		expect(result).toBe(sample.path.input);
	});

	test('Returns normalized joined path', () => {
		const driver = new DriverSupabase({
			serviceRole: sample.config.serviceRole,
			bucket: sample.config.bucket,
			endpoint: sample.config.endpoint,
			root: sample.config.root,
		});

		const result = driver['getFullPath'](sample.path.input);
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
		await driver.read(sample.path.input, { start: sample.range.start } as any);

		expect(fetch).toHaveBeenCalledWith(endpoint, {
			headers: {
				Authorization: `Bearer ${sample.config.serviceRole}`,
				Range: `bytes=${sample.range.start}-`,
			},
			method: 'GET',
		});
	});

	test('Optionally allows setting end range offset', async () => {
		await driver.read(sample.path.input, { end: sample.range.end } as any);

		expect(fetch).toHaveBeenCalledWith(endpoint, {
			headers: {
				Authorization: `Bearer ${sample.config.serviceRole}`,
				Range: `bytes=-${sample.range.end}`,
			},
			method: 'GET',
		});
	});

	test('Optionally allows setting start and end range offset', async () => {
		await driver.read(sample.path.input, sample.range);

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
			await driver.read(sample.path.input, sample.range);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`No stream returned for file "${sample.path.input}"`);
		}
	});

	test('Throws an error when returned stream is not a readable stream', async () => {
		vi.mocked(fetch).mockReturnValue({ status: 200, body: undefined } as unknown as Promise<Response>);

		expect(driver.read(sample.path.input, sample.range)).rejects.toThrowError(
			new Error(`No stream returned for file "${sample.path.input}"`),
		);
	});

	test('Returns stream', async () => {
		const stream = await driver.read(sample.path.input, sample.range);

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

describe('#head', () => {
	test('Returns object headers', async () => {
		vi.mocked(fetch).mockReturnValue({
			status: 200,
			headers: { 'content-length': sample.file.size, 'last-modified': sample.file.modified },
		} as unknown as Promise<Response>);

		const result = await driver.head(sample.path.input);

		expect(result).toStrictEqual({ 'content-length': sample.file.size, 'last-modified': sample.file.modified });
	});

	test('Ensures input is passed to getAuthenticatedUrl', async () => {
		vi.mocked(fetch).mockReturnValue({
			status: 200,
			headers: { 'content-length': sample.file.size, 'last-modified': sample.file.modified },
		} as unknown as Promise<Response>);

		driver['getAuthenticatedUrl'] = vi.fn();

		await driver.head(sample.path.input);

		expect(driver['getAuthenticatedUrl']).toHaveBeenCalledWith(sample.path.input);
	});

	test('Throws an error when a status >= 400 is sent', async () => {
		vi.mocked(fetch).mockReturnValue({
			status: 400,
			headers: { 'content-length': sample.file.size, 'last-modified': sample.file.modified },
		} as unknown as Promise<Response>);

		expect(driver.head(sample.path.input)).rejects.toThrowError(new Error(`File not found`));
	});
});

describe('#stat', () => {
	test('Returns size/modified from returned send data', async () => {
		vi.mocked(fetch).mockReturnValue({
			status: 200,
			headers: {
				get(key: any) {
					if (key === 'content-length') {
						return sample.file.size;
					} else if (key === 'last-modified') {
						return sample.file.modified;
					}

					return null;
				},
			},
		} as unknown as Promise<Response>);

		const result = await driver.stat(sample.path.input);

		expect(result).toStrictEqual({
			size: sample.file.size,
			modified: sample.file.modified,
		});
	});

	test('Throws an error when a status >= 400 is sent', async () => {
		vi.mocked(fetch).mockReturnValue({
			status: 400,
		} as unknown as Promise<Response>);

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
			upload: vi.fn(),
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

	test('Ensures input is passed to getFullPath', async () => {
		driver['getFullPath'] = vi.fn();

		await driver.write(sample.path.input, sample.stream);
		expect(driver['getFullPath']).toHaveBeenCalledWith(sample.path.input);
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
});

describe('#delete', () => {
	test('Ensures input is passed to getFullPath', async () => {
		driver['bucket'] = {
			remove: vi.fn(),
		} as any;

		driver['getFullPath'] = vi.fn();

		await driver.delete(sample.path.input);
		expect(driver['getFullPath']).toHaveBeenCalledWith(sample.path.input);
	});
});

describe('#list', () => {
	test('Constructs list objects params based on input prefix', async () => {
		// TODO: Probably a better way to do this?
		driver['bucket'] = {
			list: vi.fn().mockReturnValue({ data: [], error: null }),
		} as any;

		await driver.list(sample.path.input).next();

		expect(driver['bucket'].list).toHaveBeenCalledWith(undefined, {
			limit: 1000,
			offset: 0,
			search: sample.path.input,
		});
	});

	test('Yields file name omitting root', async () => {
		const sampleRoot = randDirectoryPath();
		const sampleFile = randFilePath();

		// TODO: Probably a better way to do this?
		driver['bucket'] = {
			list: vi.fn().mockReturnValue({
				data: [
					{
						name: sampleFile,
					},
				],
				error: null,
			}),
		} as any;

		driver['config'].root = sampleRoot;

		const iterator = driver.list(sample.path.input);
		const output: string[] = [];

		for await (const filepath of iterator) {
			output.push(filepath);
		}

		expect(driver['bucket'].list).toHaveBeenCalledWith(sampleRoot, {
			limit: 1000,
			offset: 0,
			search: sample.path.input,
		});

		expect(output).toStrictEqual([sampleFile]);
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
