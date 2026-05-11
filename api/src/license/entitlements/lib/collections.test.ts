import { useEnv } from '@directus/env';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CollectionsService } from '../../../services/index.js';
import type { Collection } from '../../../types/collection.js';
import { getSchema } from '../../../utils/get-schema.js';
import { countActiveCollections, getActiveCollections } from './collections.js';

vi.mock('@directus/env', () => ({
	useEnv: vi.fn(),
}));

vi.mock('../../../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../../services/index.js', async () => {
	const { mockItemsService } = await import('../../../test-utils/services/items-service.js');
	return { CollectionsService: mockItemsService().ItemsService };
});

function makeCollection(name: string, overrides: Partial<Pick<Collection, 'meta' | 'schema'>> = {}): Collection {
	return {
		collection: name,
		meta: { status: 'active' } as any,
		schema: { name } as any,
		...overrides,
	};
}

beforeEach(() => {
	vi.mocked(useEnv).mockReturnValue({ DB_EXCLUDE_TABLES: [] as string[] });
	vi.mocked(getSchema).mockResolvedValue({} as any);
});

afterEach(() => {
	vi.clearAllMocks();
});

describe('getActiveCollections', () => {
	test('filters out folder collections (schema is null)', async () => {
		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('content_folder', { schema: null }),
		]);

		const result = await getActiveCollections();

		expect(result.map((c) => c.collection)).toEqual(['articles']);
	});

	test('filters out only known system collections', async () => {
		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('directus_users'),
			makeCollection('directus_files'),
			makeCollection('directus_custom'),
		]);

		const result = await getActiveCollections();

		expect(result.map((c) => c.collection)).toEqual(['articles', 'directus_custom']);
	});

	test('filters out db-only collections (meta is null)', async () => {
		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('legacy_table', { meta: null }),
		]);

		const result = await getActiveCollections();

		expect(result.map((c) => c.collection)).toEqual(['articles']);
	});

	test('filters out collections whose meta.status is not "active"', async () => {
		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('archived', { meta: { status: 'inactive' } as any }),
		]);

		const result = await getActiveCollections();

		expect(result.map((c) => c.collection)).toEqual(['articles']);
	});

	test('filters out collections listed in DB_EXCLUDE_TABLES', async () => {
		vi.mocked(useEnv).mockReturnValue({ DB_EXCLUDE_TABLES: ['secrets'] });

		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('secrets'),
		]);

		const result = await getActiveCollections();

		expect(result.map((c) => c.collection)).toEqual(['articles']);
	});
});

describe('countActiveCollections', () => {
	test('returns the count after filtering', async () => {
		vi.mocked(useEnv).mockReturnValue({ DB_EXCLUDE_TABLES: ['secrets'] });

		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('directus_authors'),
			makeCollection('directus_users'),
			makeCollection('archived', { meta: { status: 'inactive' } as any }),
			makeCollection('content_folder', { schema: null }),
			makeCollection('secrets'),
		]);

		expect(await countActiveCollections()).toBe(2);
	});
});
