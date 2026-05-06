import { useEnv } from '@directus/env';
import { isSystemCollection } from '@directus/system-data';
import { CollectionsService } from '../../../services/index.js';
import type { Collection } from '../../../types/collection.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function getActiveCollections() {
	const collectionService = new CollectionsService({
		schema: await getSchema(),
	});

	const dbCollections = await collectionService.readByQuery();

	return dbCollections.filter(
		(collection) =>
			!isSystemCollection(collection.collection) &&
			!isDBOnlyCollection(collection) &&
			!isDisabledCollection(collection) &&
			!isEnvExcludedCollection(collection),
	);
}

export async function countActiveCollections() {
	const collections = await getActiveCollections();

	return collections.length;
}

function isDBOnlyCollection(collection: Collection) {
	return collection.meta === null;
}

function isDisabledCollection(collection: Collection) {
	return collection.meta?.status !== 'active';
}

function isEnvExcludedCollection(collection: Collection) {
	const env = useEnv();
	return (env['DB_EXCLUDE_TABLES'] as string[]).includes(collection.collection);
}

export function resolveCollections() {}
