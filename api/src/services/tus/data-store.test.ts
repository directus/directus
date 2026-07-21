import { useEnv } from '@directus/env';
import { ForbiddenError, UnsupportedMediaTypeError } from '@directus/errors';
import type { SchemaOverview } from '@directus/types';
import type { Upload } from '@tus/utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import getDatabase from '../../database/index.js';
import { createMockKnex, resetKnexMocks } from '../../test-utils/knex.js';
import { ItemsService } from '../items.js';
import { TusDataStore } from './data-store.js';

vi.mock('../../database/index.js', () => ({ default: vi.fn() }));

vi.mock('../../logger/index.js', () => ({ useLogger: () => ({ warn: vi.fn() }) }));

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../../test-utils/env.js');

	return mockEnv({
		STORAGE_LOCATIONS: 'local',
		STORAGE_LOCAL_DRIVER: 'local',
		STORAGE_LOCAL_ROOT: '.',
		EXTENSIONS_PATH: './extensions',
		TEMP_PATH: './node_modules/.directus',
	});
});

vi.mock('../items.js', async () => {
	const { mockItemsService } = await import('../../test-utils/services/items-service.js');
	return mockItemsService();
});

describe('TusDataStore.create', () => {
	const { db, tracker, mockSchemaBuilder } = createMockKnex();

	const schema = { collections: {}, relations: [] } as unknown as SchemaOverview;

	const baseEnv = {
		STORAGE_LOCATIONS: 'local',
		STORAGE_LOCAL_DRIVER: 'local',
		STORAGE_LOCAL_ROOT: '.',
		EXTENSIONS_PATH: './extensions',
		TEMP_PATH: './node_modules/.directus',
		FILES_MIME_TYPE_ALLOW_LIST: '*/*',
	};

	let mockDriver: any;

	const makeUpload = (metadata: Record<string, string>): Upload =>
		({
			id: 'upload-1',
			size: 1024,
			offset: 0,
			metadata: { filename_download: 'photo.jpg', type: 'image/jpeg', ...metadata },
		}) as unknown as Upload;

	const makeStore = () =>
		new TusDataStore({
			constants: { ENABLED: true, CHUNK_SIZE: null, EXPIRATION_TIME: 0, SCHEDULE: '' },
			location: 'local',
			driver: mockDriver,
			schema,
			accountability: undefined,
		});

	beforeEach(() => {
		vi.mocked(useEnv).mockReturnValue(baseEnv);
		vi.mocked(getDatabase).mockReturnValue(db);
		vi.mocked(ItemsService.prototype.createOne).mockResolvedValue('generated-pk');

		mockDriver = {
			tusExtensions: [],
			createChunkedUpload: vi.fn(async (_filename: string, upload: Upload) => upload),
		};

		// No existing file with this name, and no default folder configured
		tracker.on.select('directus_files').response([]);
		tracker.on.select('directus_settings').response([]);
	});

	afterEach(() => {
		resetKnexMocks(tracker, mockSchemaBuilder);
	});

	test('rejects a filename_disk that targets a forbidden location and never writes', async () => {
		const store = makeStore();

		await expect(store.create(makeUpload({ filename_disk: 'extensions/evil.js' }))).rejects.toThrow(ForbiddenError);
	});

	test('rejects a duplicate filename_disk and never writes', async () => {
		tracker.reset();
		tracker.on.select('directus_files').response([{ filename_disk: 'photo.jpg' }]);
		tracker.on.select('directus_settings').response([]);

		const store = makeStore();

		await expect(store.create(makeUpload({ filename_disk: 'photo.jpg' }))).rejects.toThrow(ForbiddenError);
	});

	test('passes a sanitized, unique filename_disk through to the upload', async () => {
		const store = makeStore();

		await store.create(makeUpload({ filename_disk: './subdir/../photo.jpg' }));

		expect(ItemsService.prototype.createOne).toHaveBeenCalledWith(
			expect.objectContaining({ filename_disk: 'photo.jpg' }),
			expect.anything(),
		);
	});

	test('does not run storage-path assertions when no filename_disk is provided', async () => {
		const store = makeStore();

		await store.create(makeUpload({}));

		expect(mockDriver.createChunkedUpload).toHaveBeenCalledWith('generated-pk.jpg', expect.anything());
	});

	test('treat invalid id as create instead of replace', async () => {
		const store = makeStore();

		const result = await store.create(makeUpload({ id: 'unknown-id' }));

		expect(result.metadata!['id']).toBe('generated-pk');
	});

	test('rejects an upload whose type is not in FILES_MIME_TYPE_ALLOW_LIST', async () => {
		vi.mocked(useEnv).mockReturnValue({ ...baseEnv, FILES_MIME_TYPE_ALLOW_LIST: 'image/jpeg,image/png' });

		const store = makeStore();

		await expect(store.create(makeUpload({ filename_download: 'malicious.html', type: 'text/html' }))).rejects.toThrow(
			UnsupportedMediaTypeError,
		);

		expect(ItemsService.prototype.createOne).not.toHaveBeenCalled();
	});

	test('accepts an upload whose type matches FILES_MIME_TYPE_ALLOW_LIST', async () => {
		vi.mocked(useEnv).mockReturnValue({ ...baseEnv, FILES_MIME_TYPE_ALLOW_LIST: 'image/jpeg,image/png' });

		const store = makeStore();

		await store.create(makeUpload({ filename_download: 'photo.png', type: 'image/png' }));

		expect(ItemsService.prototype.createOne).toHaveBeenCalled();
	});
});
