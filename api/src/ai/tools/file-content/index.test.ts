import { Readable } from 'node:stream';
import type { Accountability, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi, type MockedFunction } from 'vitest';
import { fileContent } from './index.js';

// Mock dependencies
vi.mock('../../../services/files.js', () => ({
	FilesService: vi.fn(),
}));

vi.mock('../../../storage/index.js', () => ({
	getStorage: vi.fn(),
}));

vi.mock('./lib/extract-text.js', () => ({
	extractTextFromBuffer: vi.fn(),
}));

const { FilesService } = await import('../../../services/files.js');
const { getStorage } = await import('../../../storage/index.js');
const { extractTextFromBuffer } = await import('./lib/extract-text.js');

describe('file-content tool', () => {
	const mockAccountability: Accountability = { user: 'test-user', role: 'test-role', admin: false };
	const mockSchema = {} as SchemaOverview;

	let mockFilesService: {
		readOne: MockedFunction<any>;
	};

	beforeEach(() => {
		vi.clearAllMocks();

		mockFilesService = {
			readOne: vi.fn(),
		};

		vi.mocked(FilesService).mockImplementation(() => mockFilesService as any);
	});

	afterEach(() => {
		vi.resetAllMocks();
	});

	test('should have correct name and description', () => {
		expect(fileContent.name).toBe('file-content');
		expect(fileContent.description).toBeDefined();
	});

	test('should successfully extract text from a PDF file', async () => {
		const mockFile = {
			id: 'test-file-id',
			storage: 'local',
			filename_disk: 'test.pdf',
			filename_download: 'document.pdf',
			type: 'application/pdf',
			filesize: 1024,
		};

		mockFilesService.readOne.mockResolvedValue(mockFile);

		const mockStream = Readable.from([Buffer.from('PDF content')]);
		const mockRead = vi.fn().mockResolvedValue(mockStream);
		const mockLocation = vi.fn().mockReturnValue({ read: mockRead });

		vi.mocked(getStorage).mockResolvedValue({
			location: mockLocation,
		} as any);

		vi.mocked(extractTextFromBuffer).mockResolvedValue('Extracted PDF text content');

		const result = await fileContent.handler({
			args: { id: 'test-file-id' },
			accountability: mockAccountability,
			schema: mockSchema,
		});

		expect(result).toEqual({
			type: 'text',
			data: {
				content: 'Extracted PDF text content',
				filename: 'document.pdf',
				type: 'application/pdf',
				truncated: false,
			},
		});
		expect(mockFilesService.readOne).toHaveBeenCalledWith('test-file-id', {
			fields: ['id', 'storage', 'filename_disk', 'filename_download', 'type', 'filesize'],
		});
		expect(extractTextFromBuffer).toHaveBeenCalled();
	});

	test('should successfully read plain text file', async () => {
		const mockFile = {
			id: 'test-file-id',
			storage: 'local',
			filename_disk: 'test.txt',
			filename_download: 'readme.txt',
			type: 'text/plain',
			filesize: 256,
		};

		mockFilesService.readOne.mockResolvedValue(mockFile);

		const textFileContent = 'This is plain text content';
		const mockStream = Readable.from([Buffer.from(textFileContent)]);
		const mockRead = vi.fn().mockResolvedValue(mockStream);
		const mockLocation = vi.fn().mockReturnValue({ read: mockRead });

		vi.mocked(getStorage).mockResolvedValue({
			location: mockLocation,
		} as any);

		// Text files also go through extractTextFromBuffer
		vi.mocked(extractTextFromBuffer).mockResolvedValue(textFileContent);

		const result = await fileContent.handler({
			args: { id: 'test-file-id' },
			accountability: mockAccountability,
			schema: mockSchema,
		});

		expect(result).toEqual({
			type: 'text',
			data: {
				content: textFileContent,
				filename: 'readme.txt',
				type: 'text/plain',
				truncated: false,
			},
		});
	});

	test('should throw error for unsupported file type', async () => {
		const mockFile = {
			id: 'test-file-id',
			storage: 'local',
			filename_disk: 'test.exe',
			filename_download: 'program.exe',
			type: 'application/octet-stream',
			filesize: 4096,
		};

		mockFilesService.readOne.mockResolvedValue(mockFile);

		await expect(
			fileContent.handler({
				args: { id: 'test-file-id' },
				accountability: mockAccountability,
				schema: mockSchema,
			}),
		).rejects.toThrow('Unsupported media type');
	});

	test('should truncate content at max_length', async () => {
		const mockFile = {
			id: 'test-file-id',
			storage: 'local',
			filename_disk: 'test.txt',
			filename_download: 'large.txt',
			type: 'text/plain',
			filesize: 100000,
		};

		mockFilesService.readOne.mockResolvedValue(mockFile);

		const largeContent = 'x'.repeat(10000);
		const mockStream = Readable.from([Buffer.from(largeContent)]);
		const mockRead = vi.fn().mockResolvedValue(mockStream);
		const mockLocation = vi.fn().mockReturnValue({ read: mockRead });

		vi.mocked(getStorage).mockResolvedValue({
			location: mockLocation,
		} as any);

		vi.mocked(extractTextFromBuffer).mockResolvedValue(largeContent);

		const result = await fileContent.handler({
			args: { id: 'test-file-id', max_length: 100 },
			accountability: mockAccountability,
			schema: mockSchema,
		});

		expect(result).toEqual({
			type: 'text',
			data: {
				content: 'x'.repeat(100),
				filename: 'large.txt',
				type: 'text/plain',
				truncated: true,
				original_length: 10000,
			},
		});
	});

	test('should validate schema correctly using Zod', () => {
		// The validateSchema is a Zod schema, so we need to test it differently
		const schema = fileContent.validateSchema;

		// Valid inputs
		expect(() => schema.parse({ id: 'valid-id' })).not.toThrow();
		expect(() => schema.parse({ id: 'valid-id', max_length: 1000 })).not.toThrow();

		// Invalid inputs
		expect(() => schema.parse({})).toThrow();
		expect(() => schema.parse({ id: 'valid-id', max_length: -1 })).toThrow();
		expect(() => schema.parse({ id: 'valid-id', max_length: 200000 })).toThrow();
	});

	test('should return endpoint based on input', () => {
		expect(fileContent.endpoint({ input: { id: 'file-123' } })).toEqual(['files', 'file-123']);
		expect(fileContent.endpoint({ input: {} })).toBeUndefined();
		expect(fileContent.endpoint({ input: null })).toBeUndefined();
	});
});
