import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';
import logger from '../../logger.js';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	const isRedshift = helper.isOneOfClients(['redshift']);

	if (isRedshift) {
		logger.warn('Skipping migration on Redshift as it does not allow creating an index');
		return;
	}

	await knex.schema.alterTable('directus_activity', (table) => {
		table.index(['timestamp']);
	});

	await knex.schema.alterTable('directus_revisions', (table) => {
		table.index(['activity']);
		table.index(['item']);
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;
	const isRedshift = helper.isOneOfClients(['redshift']);

	if (isRedshift) {
		return;
	}

	await knex.schema.alterTable('directus_activity', (table) => {
		table.dropIndex(['timestamp']);
	});

	await knex.schema.alterTable('directus_revisions', (table) => {
		table.dropIndex(['activity']);
		table.dropIndex(['item']);
	});
}
