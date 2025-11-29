import type { Accountability, File, SchemaOverview } from '@directus/types';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createTusServer } from './server.js';
import emitter from '../../emitter.js';
import { ItemsService } from '../index.js';
import { extractMetadata } from '../files/lib/extract-metadata.js';
import getDatabase from '../../database/index.js';
import { getSchema } from '../../utils/get-schema.js';

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
		test('should pass accountability to emitter.emitAction when accountability is provided (issue #26242)', async () => {
			const mockFile: Partial<File> = {
				id: 'test-file-id',
				storage: 'local',
				filename_download: 'test.txt',
				tus_id: 'upload-123',
				tus_data: null,
			};

			mockItemsService.readByQuery.mockResolvedValue([mockFile]);

			const [server, _cleanup] = await createTusServer({
				schema: mockSchema,
				accountability: mockAccountability,
			});

			const onUploadFinish = (server as any).options.onUploadFinish;
			expect(onUploadFinish).toBeDefined();

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

			const [server, _cleanup] = await createTusServer({
				schema: mockSchema,
				accountability: undefined,
			});

			const tusServer = server as any;
			const onUploadFinish = tusServer.options.onUploadFinish;

			expect(onUploadFinish).toBeDefined();

			const mockUpload = {
				id: 'upload-123',
				metadata: { id: 'test-file-id' },
			};

			await onUploadFinish({}, mockUpload);

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
