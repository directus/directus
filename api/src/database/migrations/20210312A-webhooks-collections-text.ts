import { Knex } from 'knex';
import env from '../../env';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_webhooks', (table) => {
		// TODO: Temporary fix for Knex/Oracle not supporting string to text
		if (env.DB_CLIENT !== 'oracledb') {
			table.text('collections').alter();
		}
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_webhooks', (table) => {
		// TODO: Temporary fix for Knex/Oracle not supporting string to text
		if (env.DB_CLIENT !== 'oracledb') {
			table.string('collections').alter();
		}
	});
}
