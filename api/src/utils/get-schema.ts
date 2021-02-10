import { SchemaOverview } from '../types';
import database, { schemaInspector } from '../database';
import logger from '../logger';

export async function getSchema(): Promise<SchemaOverview> {
	const schemaOverview = await schemaInspector.overview();

	for (const [collection, info] of Object.entries(schemaOverview)) {
		if (!info.primary) {
			logger.warn(`Collection "${collection}" doesn't have a primary key column and will be ignored`);
			delete schemaOverview[collection];
		}
	}

	const relations = await database.select('*').from('directus_relations');

	return {
		tables: schemaOverview,
		relations: relations,
	};
}
