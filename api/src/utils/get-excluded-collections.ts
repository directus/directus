import { isSystemCollection } from '@directus/system-data';
import type { Knex } from 'knex';
import { getCache, getSystemCache, setSystemCache } from '../cache.js';

const EXCLUDED_COLLECTIONS_CACHE_KEY = 'excluded-collections';

type ExcludedCollectionsCacheValue = {
	collections: string[];
};

function isExcludedCollectionsCacheValue(value: unknown): value is ExcludedCollectionsCacheValue {
	return (
		typeof value === 'object' &&
		value !== null &&
		'collections' in value &&
		Array.isArray(value.collections) &&
		value.collections.every((collection) => typeof collection === 'string')
	);
}

export async function getExcludedCollections(knex: Knex): Promise<Set<string>> {
	const { localSchemaCache } = getCache();

	const localCollections = await localSchemaCache.get(EXCLUDED_COLLECTIONS_CACHE_KEY);

	if (Array.isArray(localCollections) && localCollections.every((collection) => typeof collection === 'string')) {
		return new Set(localCollections);
	}

	const cachedValue = await getSystemCache(EXCLUDED_COLLECTIONS_CACHE_KEY);

	if (isExcludedCollectionsCacheValue(cachedValue)) {
		await localSchemaCache.set(EXCLUDED_COLLECTIONS_CACHE_KEY, cachedValue.collections);
		return new Set(cachedValue.collections);
	}

	const rows = (await knex.select('collection').from('directus_collections').where('excluded', true)) as {
		collection: string;
	}[];

	const collections = rows.map((row) => row.collection).filter((collection) => !isSystemCollection(collection));

	await Promise.all([
		localSchemaCache.set(EXCLUDED_COLLECTIONS_CACHE_KEY, collections),
		setSystemCache(EXCLUDED_COLLECTIONS_CACHE_KEY, { collections }),
	]);

	return new Set(collections);
}
