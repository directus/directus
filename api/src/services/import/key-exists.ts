import type { PrimaryKey } from '@directus/types';
import type { Knex } from 'knex';

export async function keyExists(trx: Knex, collection: string, pkField: string, value: PrimaryKey): Promise<boolean> {
	const result = await trx
		.select(pkField)
		.from(collection)
		.where({ [pkField]: value })
		.first();

	return Boolean(result);
}
