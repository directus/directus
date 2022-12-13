import { normalizePath } from '@directus/utils';
import {
	rand,
	randAlphaNumeric,
	randDirectoryPath,
	randFileExt,
	randFilePath,
	randFileType,
	randGitBranch as randCloudName,
	randGitCommitSha as randSha,
	randGitShortSha as randUnique,
	randNumber,
	randPastDate,
	randText,
	randWord,
} from '@ngneat/falso';
import type { Hash } from 'node:crypto';
import { createHash } from 'node:crypto';
import type { ParsedPath } from 'node:path';
import { extname, join, parse } from 'node:path';
import { PassThrough, Readable } from 'node:stream';
import { ReadableStream } from 'node:stream/web';
import type { Response } from 'undici';
import { fetch } from 'undici';
import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from './constants.js';
import type { DriverCloudinaryConfig } from './index.js';
import { DriverCloudinary } from './index.js';

vi.mock('@directus/utils/node');
vi.mock('@directus/utils');
vi.mock('node:path');
vi.mock('node:crypto');
vi.mock('node:stream');
vi.mock('undici');

let sample: {
	config: Required<DriverCloudinaryConfig>;
	path: {
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
	stream: PassThrough;
	text: string;
	file: {
		type: string;
		size: number;
		modified: Date;
	};
};

let driver: DriverCloudinary;

beforeEach(() => {
	sample = {
		config: {
			root: randDirectoryPath(),
			apiKey: randNumber({ length: 15 }).join(''),
			apiSecret: randAlphaNumeric({ length: 27 }).join(''),
			cloudName: randCloudName(),
			accessMode: rand(['public', 'authenticated']),
		},
		path: {
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
		stream: new PassThrough(),
		text: randText(),
		file: {
			type: randFileType(),
			size: randNumber(),
			modified: randPastDate(),
		},
	};

	driver = new DriverCloudinary({
		cloudName: sample.config.cloudName,
		apiKey: sample.config.apiKey,
		apiSecret: sample.config.apiSecret,
		accessMode: sample.config.accessMode,
	});

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
	test('Saves apiKey internally', () => {
		expect(driver['apiKey']).toBe(sample.config.apiKey);
	});

	test('Saves apiSecret internally', () => {
		expect(driver['apiSecret']).toBe(sample.config.apiSecret);
	});

	test('Saves cloudName internally', () => {
		expect(driver['cloudName']).toBe(sample.config.cloudName);
	});

	test('Saves accessMode internally', () => {
		expect(driver['accessMode']).toBe(sample.config.accessMode);
	});

	test('Defaults root to empty string', () => {
		expect(driver['root']).toBe('');
	});

	test('Normalizes config path when root is given', () => {
		vi.mocked(normalizePath).mockReturnValue(sample.path.inputFull);

		new DriverCloudinary({
			cloudName: sample.config.cloudName,
			apiKey: sample.config.apiKey,
			apiSecret: sample.config.apiSecret,
			root: sample.config.root,
			accessMode: sample.config.accessMode,
		});

		expect(normalizePath).toHaveBeenCalledWith(sample.config.root, { removeLeading: true });
	});
});

describe('#fullPath', () => {
	test('Returns normalized joined path', () => {
		vi.mocked(join).mockReturnValue(sample.path.inputFull);
		vi.mocked(normalizePath).mockReturnValue(sample.path.inputFull);

		const driver = new DriverCloudinary({
			cloudName: sample.config.cloudName,
			apiKey: sample.config.apiKey,
			apiSecret: sample.config.apiSecret,
			accessMode: sample.config.accessMode,
		});

		driver['root'] = sample.config.root;

		const result = driver['fullPath'](sample.path.input);

		expect(join).toHaveBeenCalledWith(sample.config.root, sample.path.input);
		expect(normalizePath).toHaveBeenCalledWith(sample.path.inputFull, { removeLeading: true });
		expect(result).toBe(sample.path.inputFull);
	});
});

describe('#toFormUrlEncoded', () => {
	let mockProps: [string, string, string];
	let mockValues: [string, string, string];

	beforeEach(() => {
		mockProps = Array.from(Array(3), () => randAlphaNumeric({ length: randNumber({ min: 2, max: 15 }) }).join('')) as [
			string,
			string,
			string
		];

		mockValues = randWord({ length: 3 }) as [string, string, string];
	});

	test('Parses plain object of strings', () => {
		expect(
			driver['toFormUrlEncoded']({
				[mockProps[0]]: mockValues[0],
				[mockProps[1]]: mockValues[1],
				[mockProps[2]]: mockValues[2],
			})
		).toBe(`${mockProps[0]}=${mockValues[0]}&${mockProps[1]}=${mockValues[1]}&${mockProps[2]}=${mockValues[2]}`);
	});

	test('Optionally sorts the properties alphabetically', () => {
		// Expected order should be 2-0-1
		mockProps[0] = `b_${mockProps[0]}`;
		mockProps[1] = `c_${mockProps[1]}`;
		mockProps[2] = `a_${mockProps[2]}`;

		expect(
			driver['toFormUrlEncoded'](
				{
					[mockProps[0]]: mockValues[0],
					[mockProps[1]]: mockValues[1],
					[mockProps[2]]: mockValues[2],
				},
				{ sort: true }
			)
		).toBe(`${mockProps[2]}=${mockValues[2]}&${mockProps[0]}=${mockValues[0]}&${mockProps[1]}=${mockValues[1]}`);
	});
});

describe('#getFullSignature', () => {
	let mockPayload: Record<string, string>;
	let mockCreateHash: {
		update: Mock;
		digest: Mock;
	};

	beforeEach(() => {
		mockCreateHash = {
			update: vi.fn().mockReturnThis(),
			digest: vi.fn().mockReturnThis(),
		};

		vi.mocked(createHash).mockReturnValue(mockCreateHash as unknown as Hash);

		driver['toFormUrlEncoded'] = vi.fn();

		const randLength = randNumber({ min: 1, max: 10 });

		const props = randWord({ length: randLength });
		const values = randWord({ length: randLength });

		mockPayload = Object.fromEntries(props.map((key, index) => [key, values[index]!]));
	});

	test('Ignores Cloudinary denylist of keys', () => {
		const payload = {
			...mockPayload,

			// Ignored properties:
			file: randText(),
			cloud_name: randCloudName(),
			resource_type: randWord(),
			api_key: randAlphaNumeric({ length: 15 }).join(''),
		};

		driver['getFullSignature'](payload);

		expect(driver['toFormUrlEncoded']).toHaveBeenCalledWith(mockPayload, { sort: true });
	});

	test('Creates sha1 hash', () => {
		driver['getFullSignature'](mockPayload);
		expect(createHash).toHaveBeenCalledWith('sha1');
	});

	test('Updates sha1 hash with signature payload + api secret', () => {
		const mockFormUrlEncoded = randWord();
		vi.mocked(driver['toFormUrlEncoded']).mockReturnValue(mockFormUrlEncoded);

		driver['getFullSignature'](mockPayload);

		expect(mockCreateHash.update).toHaveBeenCalledWith(mockFormUrlEncoded + sample.config.apiSecret);
	});

	test('Digests hash as hex', () => {
		driver['getFullSignature'](mockPayload);
		expect(mockCreateHash.digest).toHaveBeenCalledWith('hex');
	});

	test('Returns digested hash', () => {
		const mockHash = randSha();
		mockCreateHash.digest.mockReturnValue(mockHash);

		const hash = driver['getFullSignature'](mockPayload);

		expect(hash).toBe(mockHash);
	});
});

describe('#getParameterSignature', () => {
	let mockHash: string;
	let result: string;
	let mockCreateHash: {
		update: Mock;
		digest: Mock;
	};

	beforeEach(() => {
		mockHash = randSha();

		mockCreateHash = {
			update: vi.fn().mockReturnThis(),
			digest: vi.fn().mockReturnValue(mockHash),
		};

		vi.mocked(createHash).mockReturnValue(mockCreateHash as unknown as Hash);

		result = driver['getParameterSignature'](sample.path.input);
	});

	test('Creates SHA1 hash', () => {
		expect(createHash).toHaveBeenCalledWith('sha1');
	});

	test('Updates hash with passed filepath + apiSecret', () => {
		expect(mockCreateHash.update).toHaveBeenCalledWith(sample.path.input + sample.config.apiSecret);
	});

	test('Digests hash to base64url', () => {
		expect(mockCreateHash.digest).toHaveBeenCalledWith('base64url');
	});

	test('Returns first 8 characters of base64 sha hash wrapped in Cloudinary prefix/suffix', () => {
		expect(result).toBe(`s--${mockHash.substring(0, 8)}--`);
	});
});

describe('#getTimestamp', () => {
	let mockDate: Date;

	beforeEach(() => {
		mockDate = randPastDate();
		vi.useFakeTimers();
		vi.setSystemTime(mockDate);
	});

	test('Returns unix timestamp for current time', () => {
		expect(driver['getTimestamp']()).toBe(mockDate.getTime());
	});
});

describe('#getResourceType', () => {
	test('Returns "image" for extensions contained in the image extensions constant', () => {
		IMAGE_EXTENSIONS.forEach((ext) => expect(driver['getResourceType'](ext)).toBe('image'));
	});

	test('Returns "video" for extensions contained in the video extensions constant', () => {
		VIDEO_EXTENSIONS.forEach((ext) => expect(driver['getResourceType'](ext)).toBe('video'));
	});

	test('Returns "raw" for unknown / other extensions', () => {
		randWord({ length: 5 }).forEach((ext) => expect(driver['getResourceType'](ext)).toBe('raw'));
	});
});

describe('#getPublicId', () => {
	let mockResourceType: string;
	let mockParsedPath: string;

	beforeEach(() => {
		mockResourceType = rand(['image', 'video', 'raw']);
		mockParsedPath = randDirectoryPath();
		driver['getResourceType'] = vi.fn().mockReturnValue(mockResourceType);
		vi.mocked(parse).mockReturnValue({ name: mockParsedPath } as ParsedPath);
	});

	test('Gets resourceType for given filepath', () => {
		driver['getPublicId'](sample.path.input);
		expect(driver['getResourceType']).toHaveBeenCalledWith(sample.path.input);
	});

	test('Returns original file path if type is raw', () => {
		driver['getResourceType'] = vi.fn().mockReturnValue('raw');
		const publicId = driver['getPublicId'](sample.path.input);
		expect(publicId).toBe(sample.path.input);
	});

	test('Parsed base path if other type', () => {
		driver['getResourceType'] = vi.fn().mockReturnValue(rand(['image', 'video']));
		const publicId = driver['getPublicId'](sample.path.input);
		expect(publicId).toBe(mockParsedPath);
	});
});

describe('#getBasicAuth', () => {
	let mockToString: Mock;

	beforeEach(() => {
		mockToString = vi.fn();
		vi.spyOn(Buffer, 'from').mockReturnValue({ toString: mockToString } as unknown as Buffer);
	});

	test('Creates base64 hash of key:secret', () => {
		driver['getBasicAuth']();

		expect(Buffer.from).toHaveBeenCalledWith(`${sample.config.apiKey}:${sample.config.apiSecret}`);
		expect(mockToString).toHaveBeenCalledWith('base64');
	});

	test(`Returns 'Basic <base64>'`, () => {
		const mockBase64 = randSha();
		mockToString.mockReturnValue(mockBase64);

		const result = driver['getBasicAuth']();

		expect(result).toBe(`Basic ${mockBase64}`);
	});
});

describe('#read', () => {
	let mockResourceType: 'image' | 'video' | 'raw';
	let mockParameterSignature: string;
	let mockResponse: {
		status: number;
		body: ReadableStream | null;
	};

	beforeEach(() => {
		mockResourceType = rand(['image', 'video', 'raw']);
		mockParameterSignature = `s--${randAlphaNumeric({ length: 8 }).join('')}--`;

		mockResponse = {
			status: 200,
			body: new ReadableStream(),
		};

		driver['getResourceType'] = vi.fn().mockReturnValue(mockResourceType);
		driver['getParameterSignature'] = vi.fn().mockReturnValue(mockParameterSignature);

		vi.mocked(fetch).mockResolvedValue(mockResponse as Response);
	});

	test('Gets resource type for extension of given filepath', async () => {
		const mockFileExt = randFileExt();
		vi.mocked(extname).mockReturnValue(mockFileExt);

		await driver.read(sample.path.input);

		expect(extname).toHaveBeenCalledWith(sample.path.input);
		expect(driver['getResourceType']).toHaveBeenCalledWith(mockFileExt);
	});

	test('Creates signature for full filepath', async () => {
		await driver.read(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(driver['getParameterSignature']).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test('Calls fetch with generated URL', async () => {
		await driver.read(sample.path.input);

		expect(fetch).toHaveBeenCalledWith(
			`https://res.cloudinary.com/${sample.config.cloudName}/${mockResourceType}/upload/${mockParameterSignature}/${sample.path.inputFull}`,
			{ method: 'GET' }
		);
	});

	test('Adds optional Range header for start', async () => {
		await driver.read(sample.path.input, { start: sample.range.start });

		expect(fetch).toHaveBeenCalledWith(
			`https://res.cloudinary.com/${sample.config.cloudName}/${mockResourceType}/upload/${mockParameterSignature}/${sample.path.inputFull}`,
			{ method: 'GET', headers: { Range: `bytes=${sample.range.start}-` } }
		);
	});

	test('Adds optional Range header for end', async () => {
		await driver.read(sample.path.input, { end: sample.range.end });

		expect(fetch).toHaveBeenCalledWith(
			`https://res.cloudinary.com/${sample.config.cloudName}/${mockResourceType}/upload/${mockParameterSignature}/${sample.path.inputFull}`,
			{ method: 'GET', headers: { Range: `bytes=-${sample.range.end}` } }
		);
	});

	test('Adds optional Range header for start and end', async () => {
		await driver.read(sample.path.input, sample.range);

		expect(fetch).toHaveBeenCalledWith(
			`https://res.cloudinary.com/${sample.config.cloudName}/${mockResourceType}/upload/${mockParameterSignature}/${sample.path.inputFull}`,
			{ method: 'GET', headers: { Range: `bytes=${sample.range.start}-${sample.range.end}` } }
		);
	});

	test('Throws error when response has status >= 400', async () => {
		mockResponse.status = randNumber({ min: 400, max: 599 });

		try {
			await driver.read(sample.path.input);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`No stream returned for file "${sample.path.input}"`);
		}
	});

	test('Throws error when response has no readable body', async () => {
		mockResponse.body = null;

		try {
			await driver.read(sample.path.input);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`No stream returned for file "${sample.path.input}"`);
		}
	});

	test('Returns readable stream from web stream', async () => {
		const mockStream = {} as Readable;
		vi.mocked(Readable.fromWeb).mockReturnValue(mockStream);

		const stream = await driver.read(sample.path.input);

		expect(Readable.fromWeb).toHaveBeenCalledWith(mockResponse.body);
		expect(stream).toBe(mockStream);
	});
});

describe('#stat', () => {
	let mockResourceType: string;
	let mockParsedPath: string;
	let mockBasicAuth: string;
	let mockResponse: { json: Mock; status: number };
	let mockResponseBody: {
		bytes: number;
		created_at: string;
	};

	beforeEach(() => {
		mockResourceType = rand(['image', 'video', 'raw']);
		mockParsedPath = randDirectoryPath();
		mockBasicAuth = randSha();

		driver['getResourceType'] = vi.fn().mockReturnValue(mockResourceType);
		driver['getPublicId'] = vi.fn().mockReturnValue(mockParsedPath);
		driver['getBasicAuth'] = vi.fn().mockReturnValue(mockBasicAuth);

		mockResponseBody = {
			bytes: sample.file.size,
			created_at: sample.file.modified.toISOString(),
		};

		mockResponse = {
			json: vi.fn().mockResolvedValue(mockResponseBody),
			status: 200,
		};

		vi.mocked(fetch).mockResolvedValue(mockResponse as unknown as Response);
	});

	test('Gets full path for given filepath', async () => {
		await driver.stat(sample.path.input);
		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
	});

	test('Gets resource type for given filepath', async () => {
		await driver.stat(sample.path.input);
		expect(driver['getResourceType']).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test('Gets publicId for given filepath', async () => {
		await driver.stat(sample.path.input);
		expect(driver['getPublicId']).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test('Calls fetch with constructed URL and auth header', async () => {
		await driver.stat(sample.path.input);
		expect(fetch).toHaveBeenCalledWith(
			`https://api.cloudinary.com/v1_1/${sample.config.cloudName}/resources/${mockResourceType}/upload/${mockParsedPath}`,
			{
				method: 'GET',
				headers: {
					Authorization: mockBasicAuth,
				},
			}
		);
	});

	test('Throws error when status is >400', async () => {
		mockResponse.status = randNumber({ min: 400, max: 599 });
		try {
			await driver.stat(sample.path.input);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`No stat returned for file "${sample.path.input}"`);
		}
	});

	test('Returns size/modified from bytes/created_at from Cloudinary', async () => {
		const result = await driver.stat(sample.path.input);
		expect(result).toStrictEqual({
			size: sample.file.size,
			modified: sample.file.modified,
		});
	});
});

describe('#exists', () => {
	beforeEach(() => {
		driver['stat'] = vi.fn().mockResolvedValue({ size: sample.file.size, modified: sample.file.modified });
	});

	test('Calls stat', async () => {
		await driver.exists(sample.path.input);
		expect(driver['stat']).toHaveBeenCalledWith(sample.path.input);
	});

	test('Returns true if stat returns the stats', async () => {
		const exists = await driver.exists(sample.path.input);
		expect(exists).toBe(true);
	});

	test('Returns false if stat throws an error', async () => {
		vi.mocked(driver.stat).mockRejectedValue(new Error());
		const exists = await driver.exists(sample.path.input);
		expect(exists).toBe(false);
	});
});

describe.todo('#move', () => {});

describe.todo('#copy', () => {});

describe.todo('#put', () => {});

describe.todo('#delete', () => {});

describe.todo('#list', () => {});
