import { useEnv } from '@directus/env';
import { isSystemCollection } from '@directus/system-data';
import type { Knex } from 'knex';
import { CollectionsService } from '../../../services/index.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function getActiveCollections(opts?: { knex?: Knex | undefined }) {
	const env = useEnv();

	const collectionService = new CollectionsService({
		schema: await getSchema(),
		knex: opts?.knex,
	});

	const dbCollections = await collectionService.readByQuery();

	return dbCollections
		.filter((collection) => {
			const isFolder = collection.schema === null;
			const isDBOnly = collection.meta === null;
			const isDisabled = collection.meta?.status !== 'active';
			const isEnvExcluded = (env['DB_EXCLUDE_TABLES'] as string[]).includes(collection.collection);

			return !isFolder && !isSystemCollection(collection.collection) && !isDBOnly && !isDisabled && !isEnvExcluded;
		})
		.map((collection) => collection.collection);
}

export async function countActiveCollections(opts?: { knex?: Knex | undefined }) {
	const collections = await getActiveCollections(opts);

	return collections.length;
}

export async function resolveCollections(collections: string[]) {
	const collectionsService = new CollectionsService({ schema: await getSchema() });

	await Promise.allSettled(
		collections.map((collection) => {
			collectionsService.updateOne(collection, {
				meta: { status: 'inactive' },
			});
		}),
	);
}
