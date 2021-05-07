import { Knex } from 'knex';
import env from '../../env';
import { oracleForceAlterColumn } from '../../utils/oracle-schema';

export async function up(knex: Knex): Promise<void> {
	if (env.DB_CLIENT === 'oracledb') {
		await oracleForceAlterColumn(knex, 'directus_webhooks', 'url', 'CLOB');
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.text('url').alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	if (env.DB_CLIENT === 'oracledb') {
		await oracleForceAlterColumn(knex, 'directus_webhooks', 'url', 'VARCHAR2(255)');
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.string('url').alter();
	});
}
