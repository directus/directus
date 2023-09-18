import { createInspector } from '@directus/schema';
import type { Knex } from 'knex';
import logger from '../../logger.js';
import { getHelpers } from '../helpers/index.js';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	const isMysql = helper.isOneOfClients(['mysql']);

	if (isMysql) {
		await dropConstraint(knex);
	}

	await knex.schema.alterTable('directus_shares', (table) => {
		table.dropNullable('collection');
		table.dropNullable('item');
	});

	if (isMysql) {
		await recreateConstraint(knex);
	}
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	const isMysql = helper.isOneOfClients(['mysql']);

	if (isMysql) {
		await dropConstraint(knex);
	}

	await knex.schema.alterTable('directus_shares', (table) => {
		table.setNullable('collection');
		table.setNullable('item');
	});

	if (isMysql) {
		await recreateConstraint(knex);
	}
}

/**
 * Temporarily drop foreign key constraint for MySQL instances, see https://github.com/directus/directus/issues/19399
 */
async function dropConstraint(knex: Knex) {
	const inspector = createInspector(knex);

	const foreignKeys = await inspector.foreignKeys('directus_shares');
	const collectionForeignKeys = foreignKeys.filter((fk) => fk.column === 'collection');
	const constraintName = collectionForeignKeys[0]?.constraint_name;

	if (constraintName && collectionForeignKeys.length === 1) {
		await knex.schema.alterTable('directus_shares', (table) => {
			table.dropForeign('collection', constraintName);
		});
	} else {
		logger.warn(`Unexpected number of foreign key constraints on 'directus_shares.collection':`);
		logger.warn(JSON.stringify(collectionForeignKeys, null, 4));
	}
}

/**
 * Recreate foreign key constraint for MySQL instances, from 20211211A-add-shares.ts
 */
async function recreateConstraint(knex: Knex) {
	return knex.schema.alterTable('directus_shares', async (table) => {
		table.foreign('collection').references('directus_collections.collection').onDelete('CASCADE');
	});
}
