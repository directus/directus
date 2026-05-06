import { isSystemCollection } from '@directus/system-data';
import { CollectionsService } from '../../../services/index.js';
import type { Collection } from '../../../types/collection.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function getActiveCollections() {
	const schema = await getSchema();

	const collectionService = new CollectionsService({ schema });

	const dbCollections = await collectionService.readByQuery();

	return dbCollections.filter(
		(collection) =>
			!isSystemCollection(collection.collection) &&
			!isDBOnlyCollection(collection) &&
			!isExcludedCollection(collection),
	);
}

export async function countActiveCollections() {
	const collections = await getActiveCollections();

	return collections.length;
}

function isDBOnlyCollection(collection: Collection) {
	return collection.meta === null;
}

function isExcludedCollection(collection: Collection) {
	return false;
}

export function resolveCollections() {}
