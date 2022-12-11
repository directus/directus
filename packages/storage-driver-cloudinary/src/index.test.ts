import type { Mock } from 'vitest';
import { normalizePath } from '@directus/utils';
import { isReadableStream } from '@directus/utils/node';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, test, vi, beforeEach } from 'vitest';
import { DriverCloudinary } from './index.js';
import type { DriverCloudinaryConfig } from './index.js';
import {
	randAlphaNumeric,
	randDirectoryPath,
	randDomainName,
	randFilePath,
	randGitBranch as randCloudName,
	randNumber,
	randPastDate,
	randWord,
	randText,
	randFileType,
	randUrl,
	randGitCommitSha as randSha,
} from '@ngneat/falso';
import type { Hash } from 'node:crypto';
import { createHash } from 'node:crypto';

vi.mock('@directus/utils/node');
vi.mock('@directus/utils');
vi.mock('node:path');
vi.mock('node:crypto');

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
		},
		path: {
			input: randFilePath(),
			inputFull: randFilePath(),
			src: randFilePath(),
			srcFull: randFilePath(),
			dest: randFilePath(),
			destFull: randFilePath(),
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
		});

		driver['root'] = sample.config.root;

		const result = driver['fullPath'](sample.path.input);

		expect(join).toHaveBeenCalledWith(sample.config.root, sample.path.input);
		expect(normalizePath).toHaveBeenCalledWith(sample.path.inputFull);
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

	test('Digests hash to base64', () => {
		expect(mockCreateHash.digest).toHaveBeenCalledWith('base64');
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

describe.todo('#getBuffer', () => {});

describe.todo('#getStat', () => {});

describe.todo('#exists', () => {});

describe.todo('#move', () => {});

describe.todo('#copy', () => {});

describe.todo('#put', () => {});

describe.todo('#delete', () => {});

describe.todo('#list', () => {});
