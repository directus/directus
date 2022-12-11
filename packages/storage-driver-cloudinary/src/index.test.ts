import type { Mock } from 'vitest';
import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
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

vi.mock('@directus/shared/utils/node');
vi.mock('@directus/shared/utils');
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
	test('Parses plain object of strings', () => {
		const props = randWord({ length: 3 }) as [string, string, string];
		const values = randWord({ length: 3 }) as [string, string, string];

		expect(
			driver['toFormUrlEncoded']({
				[props[0]]: values[0],
				[props[1]]: values[1],
				[props[2]]: values[2],
			})
		).toBe(`${props[0]}=${values[0]}&${props[1]}=${values[1]}&${props[2]}=${values[2]}`);
	});

	test('Optionally sorts the properties alphabetically', () => {
		const props = randWord({ length: 3 }) as [string, string, string];
		const values = randWord({ length: 3 }) as [string, string, string];

		// Expected order should be 2-0-1
		props[0] = `b_${props[0]}`;
		props[1] = `c_${props[1]}`;
		props[2] = `a_${props[2]}`;

		expect(
			driver['toFormUrlEncoded'](
				{
					[props[0]]: values[0],
					[props[1]]: values[1],
					[props[2]]: values[2],
				},
				{ sort: true }
			)
		).toBe(`${props[2]}=${values[2]}&${props[0]}=${values[0]}&${props[1]}=${values[1]}`);
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

describe.todo('#getStream', () => {});

describe.todo('#getBuffer', () => {});

describe.todo('#getStat', () => {});

describe.todo('#exists', () => {});

describe.todo('#move', () => {});

describe.todo('#copy', () => {});

describe.todo('#put', () => {});

describe.todo('#delete', () => {});

describe.todo('#list', () => {});
