import { useEnv } from '@directus/env';
import type { DeepPartial } from '@directus/types';
import { merge } from 'lodash-es';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CollectionsService } from '../../../services/index.js';
import type { Collection } from '../../../types/collection.js';
import { getActiveCollections } from './collections.js';

vi.mock('@directus/env', async () => {
	const { mockEnv } = await import('../../../test-utils/env.js');
	return mockEnv({ DB_EXCLUDE_TABLES: [] });
});

vi.mock('../../../utils/get-schema.js', () => ({
	getSchema: vi.fn(),
}));

vi.mock('../../../database/index.js', async () => {
	const { mockDatabase } = await import('../../../test-utils/database.js');
	return mockDatabase();
});

vi.mock('../../../services/index.js', async () => {
	const { mockCollectionsService } = await import('../../../test-utils/services/collections-service.js');
	return mockCollectionsService();
});

afterEach(() => {
	vi.clearAllMocks();
});

function makeCollection(name: string, overrides: DeepPartial<Pick<Collection, 'meta' | 'schema'>> = {}): Collection {
	return merge(
		{
			collection: name,
			meta: { status: 'active' },
			schema: { name },
		} as Collection,
		overrides,
	);
}

describe('getActiveCollections', () => {
	test('exclude folders (schema:null)', async () => {
		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('content_folder', { schema: null }),
		]);

		const result = await getActiveCollections();

		expect(result).toEqual(['articles']);
	});

	test('exclude system collections', async () => {
		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('directus_users'),
			makeCollection('directus_files'),
			makeCollection('directus_custom'),
		]);

		const result = await getActiveCollections();

		expect(result).toEqual(['articles', 'directus_custom']);
	});

	test('exclude db-only collections (meta:null)', async () => {
		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('legacy_table', { meta: null }),
		]);

		const result = await getActiveCollections();

		expect(result).toEqual(['articles']);
	});

	test('exclude collections not marked active', async () => {
		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('archived', { meta: { status: 'inactive' } as any }),
		]);

		const result = await getActiveCollections();

		expect(result).toEqual(['articles']);
	});

	test('exclude collections listed in DB_EXCLUDE_TABLES', async () => {
		vi.mocked(useEnv).mockReturnValue({ DB_EXCLUDE_TABLES: ['secrets'] });

		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('secrets'),
		]);

		const result = await getActiveCollections();

		expect(result).toEqual(['articles']);
	});

	test('returns only valid collections from a mixed payload', async () => {
		vi.mocked(useEnv).mockReturnValue({ DB_EXCLUDE_TABLES: ['secrets'] });

		vi.mocked(CollectionsService.prototype.readByQuery).mockResolvedValue([
			makeCollection('articles'),
			makeCollection('authors'),
			makeCollection('directus_users'),
			makeCollection('archived', { meta: { status: 'inactive' } }),
			makeCollection('content_folder', { schema: null }),
			makeCollection('legacy_table', { meta: null }),
			makeCollection('secrets'),
		]);

		const result = await getActiveCollections();

		expect(result).toEqual(['articles', 'authors']);
	});
});
