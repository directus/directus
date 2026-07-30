import type { Accountability, File, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import getDatabase from '../../database/index.js';
import emitter from '../../emitter.js';
import { getSchema } from '../../utils/get-schema.js';
import { extractMetadata } from '../files/lib/extract-metadata.js';
import { ItemsService } from '../index.js';
import { createTusServer } from './server.js';

vi.mock('../../emitter.js', () => ({
	default: {
		emitAction: vi.fn(),
	},
}));

vi.mock('../index.js', () => ({
	ItemsService: vi.fn(),
}));

vi.mock('../files/lib/extract-metadata.js', () => ({
	extractMetadata: vi.fn(),
}));

vi.mock('../../database/index.js', () => ({
	default: vi.fn(),
}));

vi.mock('../../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../storage/index.js', () => ({
	getStorage: vi.fn().mockResolvedValue({
		location: vi.fn().mockReturnValue({
			read: vi.fn(),
			write: vi.fn(),
			delete: vi.fn(),
			stat: vi.fn(),
			copy: vi.fn(),
			move: vi.fn(),
			list: vi.fn(),
			$createMultipartUpload: vi.fn(),
			$uploadPart: vi.fn(),
			$completeMultipartUpload: vi.fn(),
			$abortMultipartUpload: vi.fn(),
			$listParts: vi.fn(),
		}),
	}),
}));

vi.mock('@directus/storage', () => ({
	supportsTus: vi.fn().mockReturnValue(true),
}));

vi.mock('@directus/env', () => ({
	useEnv: vi.fn().mockReturnValue({
		STORAGE_LOCATIONS: 'local',
		PUBLIC_URL: 'http://localhost:8055',
		CORS_ALLOWED_HEADERS: ['*'],
		CORS_EXPOSED_HEADERS: ['*'],
	}),
}));

describe('createTusServer', () => {
	let mockSchema: SchemaOverview;
	let mockAccountability: Accountability;
	let mockDatabase: any;
	let mockItemsService: any;

	beforeEach(() => {
		mockSchema = {
			collections: {},
			relations: [],
		};

		mockAccountability = {
			role: 'test-role',
			user: 'test-user-id',
		} as Accountability;

		mockDatabase = {};

		mockItemsService = {
			readByQuery: vi.fn(),
			readOne: vi.fn(),
			updateOne: vi.fn(),
			deleteOne: vi.fn(),
		};

		vi.mocked(getDatabase).mockReturnValue(mockDatabase);
		vi.mocked(getSchema).mockResolvedValue(mockSchema);
		vi.mocked(ItemsService).mockImplementation(() => mockItemsService);
		vi.mocked(extractMetadata).mockResolvedValue({});
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('onUploadFinish', () => {
		test('should return early when file is not found', async () => {
			mockItemsService.readByQuery.mockResolvedValue([]);

			const [server] = await createTusServer({ schema: mockSchema, accountability: mockAccountability });
			const onUploadFinish = (server as any).options.onUploadFinish;

			const result = await onUploadFinish({}, { id: 'upload-123', metadata: { id: 'nonexistent' } });

			expect(result).toEqual({});
			expect(mockItemsService.readByQuery).toHaveBeenCalled();
			expect(mockItemsService.updateOne).not.toHaveBeenCalled();
			expect(emitter.emitAction).not.toHaveBeenCalled();
		});

		test('should clear tus fields and extract metadata for new uploads', async () => {
			const mockFile: Partial<File> = {
				id: 'new-file-id',
				storage: 'local',
				filename_download: 'photo.jpg',
				filesize: 1024,
				type: 'image/jpeg',
				tus_id: 'upload-456',
				tus_data: { metadata: { id: 'new-file-id' } } as any,
			};

			mockItemsService.readByQuery.mockResolvedValue([mockFile]);
			vi.mocked(extractMetadata).mockResolvedValue({ width: 100, height: 200 });

			const [server] = await createTusServer({ schema: mockSchema, accountability: mockAccountability });
			const onUploadFinish = (server as any).options.onUploadFinish;

			await onUploadFinish({}, { id: 'upload-456', metadata: { id: 'new-file-id' } });

			expect(extractMetadata).toHaveBeenCalledWith('local', expect.objectContaining({ id: 'new-file-id' }));

			expect(mockItemsService.updateOne).toHaveBeenCalledWith('new-file-id', {
				width: 100,
				height: 200,
				tus_id: null,
				tus_data: null,
			});

			// Should not attempt to read or delete any existing file since this is a new upload, not a replacement
			expect(mockItemsService.readOne).not.toHaveBeenCalled();
			expect(mockItemsService.deleteOne).not.toHaveBeenCalled();

			// Event payload should have tus fields cleared
			expect(emitter.emitAction).toHaveBeenCalledWith(
				'files.upload',
				{
					payload: expect.objectContaining({
						id: 'new-file-id',
						tus_id: null,
						tus_data: null,
						width: 100,
						height: 200,
					}),
					key: 'new-file-id',
					collection: 'directus_files',
				},
				expect.anything(),
			);
		});

		test('should return Directus-File-Id header with target file id', async () => {
			const mockFile: Partial<File> = {
				id: 'file-id',
				storage: 'local',
				filename_download: 'test.txt',
				tus_id: 'upload-abc',
				tus_data: null,
			};

			mockItemsService.readByQuery.mockResolvedValue([mockFile]);

			const [server] = await createTusServer({ schema: mockSchema, accountability: mockAccountability });
			const onUploadFinish = (server as any).options.onUploadFinish;

			const result = await onUploadFinish({}, { id: 'upload-abc', metadata: { id: 'file-id' } });

			expect(result).toEqual({ headers: { 'Directus-File-Id': 'file-id' } });
		});

		test('should replace existing file when metadata id differs from file id', async () => {
			const tempFile: Partial<File> = {
				id: 'temp-file-id',
				storage: 'local',
				filename_download: 'updated.png',
				filesize: 2048,
				type: 'image/png',
				tus_id: 'upload-789',
				tus_data: { metadata: { id: 'original-file-id' } } as any,
			};

			const originalFile: Partial<File> = {
				id: 'original-file-id',
				storage: 'local',
				filename_download: 'original.jpg',
				filesize: 512,
				type: 'image/jpeg',
			};

			mockItemsService.readByQuery.mockResolvedValue([tempFile]);
			mockItemsService.readOne.mockResolvedValue(originalFile);
			vi.mocked(extractMetadata).mockResolvedValue({ width: 400, height: 300 });

			const [server] = await createTusServer({ schema: mockSchema, accountability: mockAccountability });
			const onUploadFinish = (server as any).options.onUploadFinish;

			await onUploadFinish({}, { id: 'upload-789', metadata: { id: 'original-file-id' } });

			// Should read the original file
			expect(mockItemsService.readOne).toHaveBeenCalledWith('original-file-id');

			// Should extract metadata using original file's storage with uploaded file's fields
			expect(extractMetadata).toHaveBeenCalledWith(
				'local',
				expect.objectContaining({
					filename_download: 'updated.png',
					filesize: 2048,
					type: 'image/png',
				}),
			);

			// Should update the original file with new fields + metadata
			expect(mockItemsService.updateOne).toHaveBeenCalledWith('original-file-id', {
				filename_download: 'updated.png',
				filesize: 2048,
				type: 'image/png',
				width: 400,
				height: 300,
			});

			// Should delete the temp file
			expect(mockItemsService.deleteOne).toHaveBeenCalledWith('temp-file-id');

			// Should emit with the original file id and merged payload
			expect(emitter.emitAction).toHaveBeenCalledWith(
				'files.upload',
				{
					payload: expect.objectContaining({
						id: 'original-file-id',
						storage: 'local',
						filename_download: 'updated.png',
						filesize: 2048,
						type: 'image/png',
						width: 400,
						height: 300,
					}),
					key: 'original-file-id',
					collection: 'directus_files',
				},
				expect.anything(),
			);
		});

		test('should return Directus-File-Id header with target id on replacement', async () => {
			const tempFile: Partial<File> = {
				id: 'temp-file-id',
				storage: 'local',
				filename_download: 'replaced.png',
				filesize: 2048,
				type: 'image/png',
				tus_id: 'upload-replace',
				tus_data: { metadata: { id: 'original-file-id' } } as any,
			};

			const originalFile: Partial<File> = {
				id: 'original-file-id',
				storage: 'local',
				filename_download: 'original.jpg',
				filesize: 512,
				type: 'image/jpeg',
			};

			mockItemsService.readByQuery.mockResolvedValue([tempFile]);
			mockItemsService.readOne.mockResolvedValue(originalFile);

			const [server] = await createTusServer({ schema: mockSchema, accountability: mockAccountability });
			const onUploadFinish = (server as any).options.onUploadFinish;

			const result = await onUploadFinish({}, { id: 'upload-replace', metadata: { id: 'original-file-id' } });

			expect(result).toEqual({ headers: { 'Directus-File-Id': 'original-file-id' } });
		});

		test('should pass accountability to emitter.emitAction when accountability is provided (issue #26242)', async () => {
			const mockFile: Partial<File> = {
				id: 'test-file-id',
				storage: 'local',
				filename_download: 'test.txt',
				tus_id: 'upload-123',
				tus_data: null,
			};

			mockItemsService.readByQuery.mockResolvedValue([mockFile]);

			const [server] = await createTusServer({
				schema: mockSchema,
				accountability: mockAccountability,
			});

			const onUploadFinish = (server as any).options.onUploadFinish;

			await onUploadFinish(
				{},
				{
					id: 'upload-123',
					metadata: { id: 'test-file-id' },
				},
			);

			expect(emitter.emitAction).toHaveBeenCalledWith(
				'files.upload',
				{
					payload: {
						id: 'test-file-id',
						storage: 'local',
						filename_download: 'test.txt',
						tus_id: null,
						tus_data: null,
					},
					key: 'test-file-id',
					collection: 'directus_files',
				},
				{
					schema: mockSchema,
					database: mockDatabase,
					accountability: mockAccountability,
				},
			);
		});

		test('should pass null accountability to emitter.emitAction when accountability is not provided', async () => {
			const mockFile: Partial<File> = {
				id: 'test-file-id',
				storage: 'local',
				filename_download: 'test.txt',
				tus_id: 'upload-123',
				tus_data: null,
			};

			mockItemsService.readByQuery.mockResolvedValue([mockFile]);

			const [server] = await createTusServer({
				schema: mockSchema,
				accountability: undefined,
			});

			const onUploadFinish = (server as any).options.onUploadFinish;

			await onUploadFinish(
				{},
				{
					id: 'upload-123',
					metadata: { id: 'test-file-id' },
				},
			);

			expect(emitter.emitAction).toHaveBeenCalledWith(
				'files.upload',
				{
					payload: {
						id: 'test-file-id',
						storage: 'local',
						filename_download: 'test.txt',
						tus_id: null,
						tus_data: null,
					},
					key: 'test-file-id',
					collection: 'directus_files',
				},
				{
					schema: mockSchema,
					database: mockDatabase,
					accountability: null,
				},
			);
		});
	});
});
