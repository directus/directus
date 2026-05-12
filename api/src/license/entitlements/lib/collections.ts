import { useEnv } from '@directus/env';
import { isSystemCollection } from '@directus/system-data';
import type { Knex } from 'knex';
import { CollectionsService } from '../../../services/index.js';
import type { Collection } from '../../../types/collection.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function getActiveCollections(opts?: { knex?: Knex | undefined }) {
	const collectionService = new CollectionsService({
		schema: await getSchema(),
		knex: opts?.knex,
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

export async function countActiveCollections(opts?: { knex?: Knex | undefined }) {
	const collections = await getActiveCollections(opts);

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

export async function resolveCollections(collections: string[]) {
	const collectionsService = new CollectionsService({ schema: await getSchema() });

	await Promise.allSettled(
		collections.map((collection) => {
			collectionsService.updateOne(collection, {
				// @ts-ignore TODO fix collection type
				meta: { status: 'inactive' }
			})
		})
	);
}
