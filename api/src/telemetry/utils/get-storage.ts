import { type Knex } from 'knex';

export const getStorage = async (db: Knex) => {
	const fileStorage = await db('directus_files').sum('filesize').as('sum').first();
	return fileStorage?.['sum'] ?? 0;
};
