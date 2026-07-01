import type { SchemaOverview } from '@directus/types';
import type { Knex } from 'knex';
import { ItemsService } from '../../services/items.js';

export async function serviceCount(db: Knex, schema: SchemaOverview, collection: string): Promise<number> {
	const service = new ItemsService(collection, { knex: db, schema });
	const result = (await service.readByQuery({ aggregate: { count: ['*'] } })) as any[];
	return Number(result[0]?.count ?? 0);
}
