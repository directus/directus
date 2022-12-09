import type { ContainerClient } from '@azure/storage-blob';
import type { Mock } from 'vitest';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
import { join } from 'node:path';
import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, test, vi, beforeEach } from 'vitest';
import { DriverAzure } from './index.js';
import type { DriverAzureConfig } from './index.js';
import {
	randAlphaNumeric,
	randDirectoryPath,
	randDomainName,
	randFilePath,
	randGitBranch as randContainer,
	randNumber,
	randPastDate,
	randWord,
	randText,
	randFileType,
	randUrl,
} from '@ngneat/falso';

vi.mock('@directus/shared/utils/node');
vi.mock('@directus/shared/utils');
vi.mock('@azure/storage-blob');
vi.mock('node:path');

let sample: {
	config: Required<DriverAzureConfig>;
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

let driver: DriverAzure;

beforeEach(() => {
	sample = {
		config: {
			containerName: randContainer(),
			accountName: randWord(),
			accountKey: randAlphaNumeric({ length: 40 }).join(''),
			root: randDirectoryPath(),
			endpoint: `https://${randDomainName()}`,
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

	driver = new DriverAzure({
		containerName: sample.config.containerName,
		accountKey: sample.config.accountKey,
		accountName: sample.config.accountName,
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
	test('Creates signed credentials', () => {
		expect(StorageSharedKeyCredential).toHaveBeenCalledWith(sample.config.accountName, sample.config.accountKey);
		expect(driver['signedCredentials']).toBeInstanceOf(StorageSharedKeyCredential);
	});

	test('Creates blob service client and sets containerClient', () => {
		const mockSignedCredentials = {} as StorageSharedKeyCredential;
		vi.mocked(StorageSharedKeyCredential).mockReturnValueOnce(mockSignedCredentials);

		const mockContainerClient = {} as ContainerClient;

		const mockBlobServiceClient = {
			getContainerClient: vi.fn().mockReturnValue(mockContainerClient),
		} as unknown as BlobServiceClient;

		vi.mocked(BlobServiceClient).mockReturnValue(mockBlobServiceClient);

		const driver = new DriverAzure({
			containerName: sample.config.containerName,
			accountName: sample.config.accountName,
			accountKey: sample.config.accountKey,
		});

		expect(BlobServiceClient).toHaveBeenCalledWith(
			`https://${sample.config.accountName}.blob.core.windows.net`,
			mockSignedCredentials
		);

		expect(mockBlobServiceClient.getContainerClient).toHaveBeenCalledWith(sample.config.containerName);
		expect(driver['containerClient']).toBe(mockContainerClient);
	});

	test('Allows overriding endpoint with optional setting', () => {
		test('Creates blob service client and sets containerClient', () => {
			const mockSignedCredentials = {} as StorageSharedKeyCredential;
			vi.mocked(StorageSharedKeyCredential).mockReturnValueOnce(mockSignedCredentials);

			const mockContainerClient = {} as ContainerClient;

			const mockBlobServiceClient = {
				getContainerClient: vi.fn().mockReturnValue(mockContainerClient),
			} as unknown as BlobServiceClient;

			vi.mocked(BlobServiceClient).mockReturnValue(mockBlobServiceClient);

			const driver = new DriverAzure({
				containerName: sample.config.containerName,
				accountName: sample.config.accountName,
				accountKey: sample.config.accountKey,
				endpoint: sample.config.endpoint,
			});

			expect(BlobServiceClient).toHaveBeenCalledWith(sample.config.endpoint, mockSignedCredentials);

			expect(mockBlobServiceClient.getContainerClient).toHaveBeenCalledWith(sample.config.containerName);
			expect(driver['containerClient']).toBe(mockContainerClient);
		});
	});

	test('Defaults root path to empty string', () => {
		expect(driver['root']).toBe('');
	});

	test('Normalizes config path when root is given', () => {
		vi.mocked(normalizePath).mockReturnValue(sample.path.inputFull);

		new DriverAzure({
			containerName: sample.config.containerName,
			accountName: sample.config.accountName,
			accountKey: sample.config.accountKey,
			root: sample.path.input,
		});

		expect(normalizePath).toHaveBeenCalledWith(sample.path.input, { removeLeading: true });
	});
});

describe('#fullPath', () => {
	test('Returns normalized joined path', () => {
		vi.mocked(join).mockReturnValue(sample.path.inputFull);
		vi.mocked(normalizePath).mockReturnValue(sample.path.inputFull);

		const driver = new DriverAzure({
			containerName: sample.config.containerName,
			accountName: sample.config.accountName,
			accountKey: sample.config.accountKey,
		});

		driver['root'] = sample.config.root;

		const result = driver['fullPath'](sample.path.input);

		expect(join).toHaveBeenCalledWith(sample.config.root, sample.path.input);
		expect(normalizePath).toHaveBeenCalledWith(sample.path.inputFull);
		expect(result).toBe(sample.path.inputFull);
	});
});

describe('#getStream', () => {
	let mockDownload: Mock;

	beforeEach(async () => {
		mockDownload = vi.fn().mockResolvedValue({ readableStreamBody: sample.stream });

		const mockBlobClient = vi.fn().mockReturnValue({
			download: mockDownload,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;
	});

	test('Uses blobClient at full path', async () => {
		await driver.getStream(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(driver['containerClient'].getBlobClient).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test('Calls download with undefined undefined when no range is passed', async () => {
		await driver.getStream(sample.path.input);

		expect(mockDownload).toHaveBeenCalledWith(undefined, undefined);
	});

	test('Calls download with offset if start range is provided', async () => {
		await driver.getStream(sample.path.input, { start: sample.range.start });

		expect(mockDownload).toHaveBeenCalledWith(sample.range.start, undefined);
	});

	test('Calls download with count if end range is provided', async () => {
		await driver.getStream(sample.path.input, { end: sample.range.end });

		expect(mockDownload).toHaveBeenCalledWith(undefined, sample.range.end);
	});

	test('Calls download with offset and count if start and end ranges are provided', async () => {
		await driver.getStream(sample.path.input, sample.range);

		expect(mockDownload).toHaveBeenCalledWith(sample.range.start, sample.range.end - sample.range.start);
	});

	test('Throws error when no readable stream is returned', async () => {
		mockDownload.mockResolvedValue({ readableStreamBody: undefined });

		try {
			await driver.getStream(sample.path.input);
		} catch (err: any) {
			expect(err).toBeInstanceOf(Error);
			expect(err.message).toBe(`No stream returned for file "${sample.path.input}"`);
		}
	});
});

describe('#getBuffer', () => {
	let mockBuffer: Buffer;
	let mockDownload: Mock;

	beforeEach(() => {
		mockBuffer = {} as Buffer;
		mockDownload = vi.fn().mockResolvedValue(mockBuffer);

		const mockBlobClient = vi.fn().mockReturnValue({
			downloadToBuffer: mockDownload,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;
	});

	test('Uses blobClient at full path', async () => {
		await driver.getBuffer(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(driver['containerClient'].getBlobClient).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test('Returns downloadToBuffer result', async () => {
		const result = await driver.getBuffer(sample.path.input);

		expect(mockDownload).toHaveBeenCalled();
		expect(result).toBe(mockBuffer);
	});
});

describe('#getStat', () => {
	beforeEach(() => {
		const mockGetProperties = vi.fn().mockReturnValue({
			contentLength: sample.file.size,
			lastModified: sample.file.modified,
		});

		const mockBlobClient = vi.fn().mockReturnValue({
			getProperties: mockGetProperties,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;
	});

	test('Uses blobClient at full path', async () => {
		await driver.getStat(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(driver['containerClient'].getBlobClient).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test('Returns contentLength/lastModified as size/modified from getProperties', async () => {
		const result = await driver.getStat(sample.path.input);

		expect(result).toStrictEqual({
			size: sample.file.size,
			modified: sample.file.modified,
		});
	});
});

describe('#exists', () => {
	let mockExists: Mock;

	beforeEach(() => {
		mockExists = vi.fn().mockResolvedValue(true);

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			exists: mockExists,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;
	});

	test('Uses blobClient at full path', async () => {
		await driver.exists(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(driver['containerClient'].getBlockBlobClient).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test('Returns exists result', async () => {
		const result = await driver.exists(sample.path.input);

		expect(mockExists).toHaveBeenCalled();
		expect(result).toBe(true);
	});
});

describe('#move', () => {
	let mockDeleteIfExists: Mock;
	let mockBlockBlobClient: Mock;

	beforeEach(() => {
		mockDeleteIfExists = vi.fn();

		mockBlockBlobClient = vi.fn().mockReturnValue({
			deleteIfExists: mockDeleteIfExists,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		driver.copy = vi.fn();
	});

	test('Calls #copy with src and dest', async () => {
		await driver.move(sample.path.src, sample.path.dest);

		expect(driver.copy).toHaveBeenCalledWith(sample.path.src, sample.path.dest);
	});

	test('Deletes src file after copy is completed', async () => {
		await driver.move(sample.path.src, sample.path.dest);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.src);
		expect(mockBlockBlobClient).toHaveBeenCalledWith(sample.path.srcFull);
		expect(mockDeleteIfExists).toHaveBeenCalledOnce();
	});
});

describe('#copy', () => {
	let mockPollUntilDone: Mock;
	let mockBeginCopyFromUrl: Mock;
	let mockBlockBlobClient: Mock;
	let mockUrl: string;

	beforeEach(() => {
		mockPollUntilDone = vi.fn();

		mockBeginCopyFromUrl = vi.fn().mockResolvedValue({
			pollUntilDone: mockPollUntilDone,
		});

		mockUrl = randUrl();

		mockBlockBlobClient = vi
			.fn()
			.mockReturnValueOnce({
				url: mockUrl,
			})
			.mockReturnValueOnce({
				beginCopyFromURL: mockBeginCopyFromUrl,
			});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;
	});

	test('Gets BlockBlobClient for src and dest', async () => {
		await driver.copy(sample.path.src, sample.path.dest);

		expect(driver['fullPath']).toHaveBeenCalledTimes(2);
		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.src);
		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.dest);

		expect(mockBlockBlobClient).toHaveBeenCalledTimes(2);
		expect(mockBlockBlobClient).toHaveBeenCalledWith(sample.path.srcFull);
		expect(mockBlockBlobClient).toHaveBeenCalledWith(sample.path.destFull);
	});

	test('Calls beginCopyFromUrl with source url', async () => {
		await driver.copy(sample.path.src, sample.path.dest);

		expect(mockBeginCopyFromUrl).toHaveBeenCalledOnce();
		expect(mockBeginCopyFromUrl).toHaveBeenCalledWith(mockUrl);
	});

	test('Waits for the polling to be done', async () => {
		await driver.copy(sample.path.src, sample.path.dest);

		expect(mockPollUntilDone).toHaveBeenCalledOnce();
	});
});

describe('#put', () => {
	let mockUploadStream: Mock;
	let mockUpload: Mock;
	let mockBlockBlobClient: Mock;

	beforeEach(() => {
		mockUploadStream = vi.fn();
		mockUpload = vi.fn();

		mockBlockBlobClient = vi.fn().mockReturnValue({
			uploadStream: mockUploadStream,
			upload: mockUpload,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		vi.mocked(isReadableStream).mockReturnValue(true);
	});

	test('Gets BlockBlobClient for file path', async () => {
		await driver.put(sample.path.input, sample.text);

		expect(mockBlockBlobClient).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test('Uploads stream through uploadStream when readable stream is passed', async () => {
		await driver.put(sample.path.input, sample.text);

		expect(mockUploadStream).toHaveBeenCalledWith(sample.text, undefined, undefined, {
			blobHTTPHeaders: { blobContentType: 'application/octet-stream' },
		});
	});

	test('Allows optional mime type to be set', async () => {
		await driver.put(sample.path.input, sample.text, sample.file.type);

		expect(mockUploadStream).toHaveBeenCalledWith(sample.text, undefined, undefined, {
			blobHTTPHeaders: { blobContentType: sample.file.type },
		});
	});

	test('Uses upload when buffer or string is passed', async () => {
		vi.mocked(isReadableStream).mockReturnValue(false);

		await driver.put(sample.path.input, sample.text, sample.file.type);

		expect(mockUpload).toHaveBeenCalledWith(sample.text, sample.text.length);
	});
});

describe('#delete', () => {
	let mockDeleteIfExists: Mock;

	beforeEach(() => {
		mockDeleteIfExists = vi.fn().mockResolvedValue(true);

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			deleteIfExists: mockDeleteIfExists,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;
	});

	test('Uses blobClient at full path', async () => {
		await driver.delete(sample.path.input);

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(driver['containerClient'].getBlockBlobClient).toHaveBeenCalledWith(sample.path.inputFull);
	});

	test('Returns delete result', async () => {
		await driver.delete(sample.path.input);

		expect(mockDeleteIfExists).toHaveBeenCalled();
	});
});

describe('#list', () => {
	let mockListBlobsFlat: Mock;

	beforeEach(() => {
		mockListBlobsFlat = vi.fn().mockReturnValue([]);

		driver['containerClient'] = {
			listBlobsFlat: mockListBlobsFlat,
		} as unknown as ContainerClient;
	});

	test('Uses listBlobsFlat at default empty path', async () => {
		await driver.list().next();

		expect(driver['fullPath']).toHaveBeenCalledWith('');
		expect(mockListBlobsFlat).toHaveBeenCalledWith({
			prefix: '',
		});
	});

	test('Allows for optional prefix', async () => {
		await driver.list(sample.path.input).next();

		expect(driver['fullPath']).toHaveBeenCalledWith(sample.path.input);
		expect(mockListBlobsFlat).toHaveBeenCalledWith({
			prefix: sample.path.inputFull,
		});
	});

	test('Returns blob.name for each returned blob', async () => {
		const mockFile = randFilePath();
		mockListBlobsFlat.mockReturnValue([{ name: mockFile }]);

		const output = [];

		for await (const filepath of driver.list()) {
			output.push(filepath);
		}

		expect(output).toStrictEqual([mockFile]);
	});
});
