import type { ContainerClient } from '@azure/storage-blob';
import { BlobServiceClient, StorageSharedKeyCredential } from '@azure/storage-blob';
import { normalizePath } from '@directus/shared/utils';
import { isReadableStream } from '@directus/shared/utils/node';
import { join } from 'node:path';
import type { Readable } from 'node:stream';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { DriverAzure } from './index.js';

vi.mock('@directus/shared/utils/node');
vi.mock('@directus/shared/utils');
vi.mock('@azure/storage-blob');
vi.mock('node:path');

afterEach(() => {
	vi.resetAllMocks();
});

describe('#constructor', () => {
	test('Creates signed credentials', () => {
		const mockSignedCredentials = {} as StorageSharedKeyCredential;
		vi.mocked(StorageSharedKeyCredential).mockReturnValueOnce(mockSignedCredentials);

		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		expect(StorageSharedKeyCredential).toHaveBeenCalledWith('test-account-name', 'test-account-key');
		expect(driver['signedCredentials']).toBe(mockSignedCredentials);
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
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		expect(BlobServiceClient).toHaveBeenCalledWith(
			'https://test-account-name.blob.core.windows.net',
			mockSignedCredentials
		);

		expect(mockBlobServiceClient.getContainerClient).toHaveBeenCalledWith('test-container');
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
				containerName: 'test-container',
				accountName: 'test-account-name',
				accountKey: 'test-account-key',
				endpoint: 'custom-endpoint',
			});

			expect(BlobServiceClient).toHaveBeenCalledWith('custom-endpoint', mockSignedCredentials);

			expect(mockBlobServiceClient.getContainerClient).toHaveBeenCalledWith('test-container');
			expect(driver['containerClient']).toBe(mockContainerClient);
		});
	});

	test('Defaults root path to empty string', () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		expect(driver['root']).toBe('');
	});

	test('Normalizes config path when root is given', () => {
		const testRoot = 'c:\\custom\\root\\path';
		const mockRoot = 'c:/custom/root/path';

		vi.mocked(normalizePath).mockReturnValue(mockRoot);

		new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
			root: testRoot,
		});

		expect(normalizePath).toHaveBeenCalledWith(testRoot, { removeLeading: true });
	});
});

describe('#fullPath', () => {
	test('Returns normalized joined path', () => {
		vi.mocked(join).mockReturnValue('root/path/to/file.txt');
		vi.mocked(normalizePath).mockReturnValue('root/path/to/file.txt');

		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		driver['root'] = 'root/';

		const result = driver['fullPath']('/path/to/file.txt');

		expect(join).toHaveBeenCalledWith('root/', '/path/to/file.txt');
		expect(normalizePath).toHaveBeenCalledWith('root/path/to/file.txt');
		expect(result).toBe('root/path/to/file.txt');
	});
});

describe('#getStream', () => {
	test('Uses blobClient at full path', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		driver['containerClient'] = {
			getBlobClient: vi.fn().mockReturnValue({
				download: vi.fn().mockReturnValue({ readableStreamBody: {} as Readable }),
			}),
		} as unknown as ContainerClient;

		driver['fullPath'] = vi.fn().mockReturnValue('root/path/to/file.txt');

		await driver.getStream('/path/to/file.txt');

		expect(driver['fullPath']).toHaveBeenCalledWith('/path/to/file.txt');
		expect(driver['containerClient'].getBlobClient).toHaveBeenCalledWith('root/path/to/file.txt');
	});

	test('Calls download with undefined undefined when no range is passed', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockDownload = vi.fn().mockResolvedValue({ readableStreamBody: {} as Readable });

		const mockBlobClient = vi.fn().mockReturnValue({
			download: mockDownload,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;

		await driver.getStream('/path/to/file.txt');

		expect(mockDownload).toHaveBeenCalledWith(undefined, undefined);
	});

	test('Calls download with offset if start range is provided', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockDownload = vi.fn().mockResolvedValue({ readableStreamBody: {} as Readable });

		const mockBlobClient = vi.fn().mockReturnValue({
			download: mockDownload,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;

		await driver.getStream('/path/to/file.txt', { start: 500 });

		expect(mockDownload).toHaveBeenCalledWith(500, undefined);
	});

	test('Calls download with count if end range is provided', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockDownload = vi.fn().mockResolvedValue({ readableStreamBody: {} as Readable });

		const mockBlobClient = vi.fn().mockReturnValue({
			download: mockDownload,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;

		await driver.getStream('/path/to/file.txt', { end: 1500 });

		expect(mockDownload).toHaveBeenCalledWith(undefined, 1500);
	});

	test('Calls download with offset and count if start and end ranges are provided', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockDownload = vi.fn().mockResolvedValue({ readableStreamBody: {} as Readable });

		const mockBlobClient = vi.fn().mockReturnValue({
			download: mockDownload,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;

		await driver.getStream('/path/to/file.txt', { start: 500, end: 1500 });

		expect(mockDownload).toHaveBeenCalledWith(500, 1000);
	});

	test('Throws error when no readable stream is returned', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockDownload = vi.fn().mockResolvedValue({ readableStreamBody: undefined });

		const mockBlobClient = vi.fn().mockReturnValue({
			download: mockDownload,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;

		expect(driver.getStream('/path/to/file.txt')).rejects.toThrowErrorMatchingInlineSnapshot(
			'"No stream returned for file \\"/path/to/file.txt\\""'
		);
	});
});

describe('#getBuffer', () => {
	test('Uses blobClient at full path', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockDownload = vi.fn().mockResolvedValue({});

		const mockBlobClient = vi.fn().mockReturnValue({
			downloadToBuffer: mockDownload,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;

		driver['fullPath'] = vi.fn().mockReturnValue('root/path/to/file.txt');

		await driver.getBuffer('/path/to/file.txt');

		expect(driver['fullPath']).toHaveBeenCalledWith('/path/to/file.txt');
		expect(driver['containerClient'].getBlobClient).toHaveBeenCalledWith('root/path/to/file.txt');
	});

	test('Returns downloadToBuffer result', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockBuffer = {};

		const mockDownload = vi.fn().mockResolvedValue(mockBuffer);

		const mockBlobClient = vi.fn().mockReturnValue({
			downloadToBuffer: mockDownload,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;

		const result = await driver.getBuffer('/path/to/file.txt');

		expect(mockDownload).toHaveBeenCalled();
		expect(result).toBe(mockBuffer);
	});
});

describe('#getStat', () => {
	test('Uses blobClient at full path', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockGetProperties = vi.fn().mockReturnValue({});

		const mockBlobClient = vi.fn().mockReturnValue({
			getProperties: mockGetProperties,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;

		driver['fullPath'] = vi.fn().mockReturnValue('root/path/to/file.txt');

		await driver.getStat('/path/to/file.txt');

		expect(driver['fullPath']).toHaveBeenCalledWith('/path/to/file.txt');
		expect(driver['containerClient'].getBlobClient).toHaveBeenCalledWith('root/path/to/file.txt');
	});

	test('Returns contentLength/lastModified as size/modified from getProperties', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockSize = 1500;
		const mockDate = new Date(2022, 11, 6, 10, 29, 0, 0);

		const mockGetProperties = vi.fn().mockResolvedValue({
			contentLength: mockSize,
			lastModified: mockDate,
		});

		const mockBlobClient = vi.fn().mockReturnValue({
			getProperties: mockGetProperties,
		});

		driver['containerClient'] = {
			getBlobClient: mockBlobClient,
		} as unknown as ContainerClient;

		const result = await driver.getStat('/path/to/file.txt');

		expect(result).toStrictEqual({
			size: 1500,
			modified: mockDate,
		});
	});
});

describe('#exists', () => {
	test('Uses blobClient at full path', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockExists = vi.fn().mockResolvedValue({});

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			exists: mockExists,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		driver['fullPath'] = vi.fn().mockReturnValue('root/path/to/file.txt');

		await driver.exists('/path/to/file.txt');

		expect(driver['fullPath']).toHaveBeenCalledWith('/path/to/file.txt');
		expect(driver['containerClient'].getBlockBlobClient).toHaveBeenCalledWith('root/path/to/file.txt');
	});

	test('Returns exists result', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockExists = vi.fn().mockResolvedValue(true);

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			exists: mockExists,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		const result = await driver.exists('/path/to/file.txt');

		expect(mockExists).toHaveBeenCalled();
		expect(result).toBe(true);
	});
});

describe('#move', () => {
	test('Calls #copy with src and dest', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockDeleteIfExists = vi.fn();

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			deleteIfExists: mockDeleteIfExists,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		driver.copy = vi.fn();

		await driver.move('path/to/src.txt', 'path/to/dest.txt');

		expect(driver.copy).toHaveBeenCalledWith('path/to/src.txt', 'path/to/dest.txt');
	});

	test('Deletes src file after copy is completed', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockDeleteIfExists = vi.fn();

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			deleteIfExists: mockDeleteIfExists,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		driver.copy = vi.fn();

		driver['fullPath'] = vi.fn().mockReturnValue('root/path/to/file.txt');

		await driver.move('path/to/src.txt', 'path/to/dest.txt');

		expect(driver['fullPath']).toHaveBeenCalledWith('path/to/src.txt');
		expect(mockBlockBlobClient).toHaveBeenCalledWith('root/path/to/file.txt');
		expect(mockDeleteIfExists).toHaveBeenCalledOnce();
	});
});

describe('#copy', () => {
	test('Gets BlockBlobClient for src and dest', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockBeginCopyFromUrl = vi.fn().mockResolvedValue({
			pollUntilDone: vi.fn(),
		});

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			beginCopyFromURL: mockBeginCopyFromUrl,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		driver['fullPath'] = vi
			.fn()
			.mockReturnValueOnce('root/path/to/src.txt')
			.mockReturnValueOnce('root/path/to/dest.txt');

		await driver.copy('path/to/src.txt', 'path/to/dest.txt');

		expect(driver['fullPath']).toHaveBeenCalledTimes(2);
		expect(driver['fullPath']).toHaveBeenCalledWith('path/to/src.txt');
		expect(driver['fullPath']).toHaveBeenCalledWith('path/to/dest.txt');

		expect(mockBlockBlobClient).toHaveBeenCalledTimes(2);
		expect(mockBlockBlobClient).toHaveBeenCalledWith('root/path/to/src.txt');
		expect(mockBlockBlobClient).toHaveBeenCalledWith('root/path/to/dest.txt');
	});

	test('Calls beginCopyFromUrl with source url', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockBeginCopyFromUrl = vi.fn().mockResolvedValue({
			pollUntilDone: vi.fn(),
		});

		const mockBlockBlobClient = vi
			.fn()
			.mockReturnValueOnce({
				url: 'source-url',
			})
			.mockReturnValueOnce({
				beginCopyFromURL: mockBeginCopyFromUrl,
			});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		await driver.copy('path/to/src.txt', 'path/to/dest.txt');

		expect(mockBeginCopyFromUrl).toHaveBeenCalledOnce();
		expect(mockBeginCopyFromUrl).toHaveBeenCalledWith('source-url');
	});

	test('Waits for the polling to be done', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockPollUntilDone = vi.fn();

		const mockBeginCopyFromUrl = vi.fn().mockResolvedValue({
			pollUntilDone: mockPollUntilDone,
		});

		const mockBlockBlobClient = vi
			.fn()
			.mockReturnValueOnce({
				url: 'source-url',
			})
			.mockReturnValueOnce({
				beginCopyFromURL: mockBeginCopyFromUrl,
			});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		await driver.copy('path/to/src.txt', 'path/to/dest.txt');

		expect(mockPollUntilDone).toHaveBeenCalledOnce();
	});
});

describe('#put', () => {
	test('Gets BlockBlobClient for file path', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockUploadStream = vi.fn();
		const mockUpload = vi.fn();

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			uploadStream: mockUploadStream,
			upload: mockUpload,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		driver['fullPath'] = vi.fn().mockReturnValue('root/path/to/file.txt');

		await driver.put('path/to/file.txt', 'file-content');

		expect(mockBlockBlobClient).toHaveBeenCalledWith('root/path/to/file.txt');
	});

	test('Uploads stream through uploadStream when readable stream is passed', async () => {
		vi.mocked(isReadableStream).mockReturnValue(true);

		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockUploadStream = vi.fn();
		const mockUpload = vi.fn();

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			uploadStream: mockUploadStream,
			upload: mockUpload,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		await driver.put('path/to/file.txt', 'file-content');

		expect(mockUploadStream).toHaveBeenCalledWith('file-content', undefined, undefined, {
			blobHTTPHeaders: { blobContentType: 'application/octet-stream' },
		});
	});

	test('Allows optional mime type to be set', async () => {
		vi.mocked(isReadableStream).mockReturnValue(true);

		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockUploadStream = vi.fn();
		const mockUpload = vi.fn();

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			uploadStream: mockUploadStream,
			upload: mockUpload,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		await driver.put('path/to/file.txt', 'file-content', 'text/plain');

		expect(mockUploadStream).toHaveBeenCalledWith('file-content', undefined, undefined, {
			blobHTTPHeaders: { blobContentType: 'text/plain' },
		});
	});

	test('Uses upload when buffer or string is passed', async () => {
		vi.mocked(isReadableStream).mockReturnValue(false);

		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockUploadStream = vi.fn();
		const mockUpload = vi.fn();

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			uploadStream: mockUploadStream,
			upload: mockUpload,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		await driver.put('path/to/file.txt', 'file-content', 'text/plain');

		expect(mockUpload).toHaveBeenCalledWith('file-content', 'file-content'.length);
	});
});

describe('#delete', () => {
	test('Uses blobClient at full path', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockDeleteIfExists = vi.fn().mockResolvedValue({});

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			deleteIfExists: mockDeleteIfExists,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		driver['fullPath'] = vi.fn().mockReturnValue('root/path/to/file.txt');

		await driver.delete('/path/to/file.txt');

		expect(driver['fullPath']).toHaveBeenCalledWith('/path/to/file.txt');
		expect(driver['containerClient'].getBlockBlobClient).toHaveBeenCalledWith('root/path/to/file.txt');
	});

	test('Returns delete result', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockDeleteIfExists = vi.fn().mockResolvedValue(true);

		const mockBlockBlobClient = vi.fn().mockReturnValue({
			deleteIfExists: mockDeleteIfExists,
		});

		driver['containerClient'] = {
			getBlockBlobClient: mockBlockBlobClient,
		} as unknown as ContainerClient;

		await driver.delete('/path/to/file.txt');

		expect(mockDeleteIfExists).toHaveBeenCalled();
	});
});

describe('#list', () => {
	test('Uses listBlobsFlat at root path', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockListBlobsFlat = vi.fn().mockReturnValue([]);

		driver['containerClient'] = {
			listBlobsFlat: mockListBlobsFlat,
		} as unknown as ContainerClient;

		driver['fullPath'] = vi.fn().mockReturnValue('root/');

		await driver.list().next();

		expect(driver['fullPath']).toHaveBeenCalledWith('');
		expect(mockListBlobsFlat).toHaveBeenCalledWith({
			prefix: 'root/',
		});
	});

	test('Allows for optional prefix', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockListBlobsFlat = vi.fn().mockReturnValue([]);

		driver['containerClient'] = {
			listBlobsFlat: mockListBlobsFlat,
		} as unknown as ContainerClient;

		driver['fullPath'] = vi.fn().mockReturnValue('root/optional-prefix');

		await driver.list('optional-prefix').next();

		expect(driver['fullPath']).toHaveBeenCalledWith('optional-prefix');
		expect(mockListBlobsFlat).toHaveBeenCalledWith({
			prefix: 'root/optional-prefix',
		});
	});

	test('Returns blob.name for each returned blob', async () => {
		const driver = new DriverAzure({
			containerName: 'test-container',
			accountName: 'test-account-name',
			accountKey: 'test-account-key',
		});

		const mockListBlobsFlat = vi.fn().mockReturnValue([{ name: 'test-name' }]);

		driver['containerClient'] = {
			listBlobsFlat: mockListBlobsFlat,
		} as unknown as ContainerClient;

		const output = [];

		for await (const filepath of driver.list()) {
			output.push(filepath);
		}

		expect(output).toStrictEqual(['test-name']);
	});
});
