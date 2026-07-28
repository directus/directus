import { useEnv } from '@directus/env';
import { isSystemCollection } from '@directus/system-data';
import type { Accountability } from '@directus/types';
import type { Knex } from 'knex';
import getDatabase from '../../../database/index.js';
import { CollectionsService } from '../../../services/index.js';
import { getSchema } from '../../../utils/get-schema.js';

export async function getActiveCollections(opts?: { knex?: Knex | undefined }) {
	const env = useEnv();

	const knex = opts?.knex ?? getDatabase();
	const schema = await getSchema({ database: knex });

	const collectionService = new CollectionsService({
		schema,
		knex,
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

export async function resolveCollections(collections: string[], ctx?: { accountability?: Accountability | undefined }) {
	const collectionsService = new CollectionsService({ schema: await getSchema(), accountability: ctx?.accountability });

	await Promise.allSettled(
		collections.map((collection) => {
			return collectionsService.updateOne(collection, {
				meta: { status: 'inactive' },
			});
		}),
	);
}
