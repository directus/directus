import { UnsupportedMediaTypeError } from '@directus/errors';
import type { Accountability, SchemaOverview } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import getDatabase from '../../database/index.js';
import { ItemsService } from '../items.js';
import { TusDataStore } from './data-store.js';

vi.mock('../../database/index.js', () => ({
	default: vi.fn(),
}));

vi.mock('../../logger/index.js', () => ({
	useLogger: vi.fn().mockReturnValue({
		warn: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
	}),
}));

vi.mock('../items.js', () => ({
	ItemsService: vi.fn(),
}));

let mockEnv: Record<string, unknown> = {};

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(() => mockEnv),
}));

describe('TusDataStore', () => {
	let mockSchema: SchemaOverview;
	let mockAccountability: Accountability;
	let mockItemsService: any;

	beforeEach(() => {
		mockEnv = { FILES_MIME_TYPE_ALLOW_LIST: '*/*' };

		mockSchema = {
			collections: {},
			relations: [],
		};

		mockAccountability = {
			role: 'test-role',
			user: 'test-user-id',
		} as Accountability;

		mockItemsService = {
			createOne: vi.fn().mockResolvedValue('new-file-id'),
			updateOne: vi.fn(),
			deleteOne: vi.fn(),
		};

		const mockKnex = {
			select: () => ({
				from: () => ({
					first: () => Promise.resolve(undefined),
				}),
			}),
		};

		vi.mocked(getDatabase).mockReturnValue(mockKnex as any);
		vi.mocked(ItemsService).mockImplementation(() => mockItemsService);
	});

	function createStore() {
		return new TusDataStore({
			constants: {
				ENABLED: true,
				CHUNK_SIZE: null,
				EXPIRATION_TIME: 0,
				SCHEDULE: '',
			},
			location: 'local',
			driver: {
				createChunkedUpload: vi.fn().mockImplementation((_filename, upload) => Promise.resolve(upload)),
			} as any,
			schema: mockSchema,
			accountability: mockAccountability,
		});
	}

	describe('create', () => {
		test('rejects an upload whose type is not in FILES_MIME_TYPE_ALLOW_LIST', async () => {
			mockEnv = { FILES_MIME_TYPE_ALLOW_LIST: 'image/jpeg,image/png' };

			const store = createStore();

			await expect(
				store.create({
					id: 'upload-1',
					offset: 0,
					size: 10,
					metadata: {
						filename_download: 'malicious.html',
						type: 'text/html',
					},
				} as any),
			).rejects.toSatisfy((err: unknown) => {
				return (
					err instanceof UnsupportedMediaTypeError &&
					(err as any).status_code === 415 &&
					typeof (err as any).body === 'string' &&
					(err as any).body.includes('text/html')
				);
			});

			expect(mockItemsService.createOne).not.toHaveBeenCalled();
		});

		test('accepts an upload whose type matches FILES_MIME_TYPE_ALLOW_LIST', async () => {
			mockEnv = { FILES_MIME_TYPE_ALLOW_LIST: 'image/jpeg,image/png' };

			const store = createStore();

			await store.create({
				id: 'upload-2',
				offset: 0,
				size: 10,
				metadata: {
					filename_download: 'photo.png',
					type: 'image/png',
				},
			} as any);

			expect(mockItemsService.createOne).toHaveBeenCalled();
		});

		test('allows any type when FILES_MIME_TYPE_ALLOW_LIST is the default wildcard', async () => {
			mockEnv = { FILES_MIME_TYPE_ALLOW_LIST: '*/*' };

			const store = createStore();

			await store.create({
				id: 'upload-3',
				offset: 0,
				size: 10,
				metadata: {
					filename_download: 'malicious.html',
					type: 'text/html',
				},
			} as any);

			expect(mockItemsService.createOne).toHaveBeenCalled();
		});
	});
});
