import { getHelpers } from '../helpers/index.js';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	if (helper.isOneOfClients(['oracle', 'cockroachdb'])) {
		return;
	}

	await knex.schema.alterTable('directus_files', (table) => {
		table.bigInteger('filesize').nullable().defaultTo(null).alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	if (helper.isOneOfClients(['oracle', 'cockroachdb'])) {
		return;
	}

	await knex.schema.alterTable('directus_files', (table) => {
		table.integer('filesize').nullable().defaultTo(null).alter();
	});
}
