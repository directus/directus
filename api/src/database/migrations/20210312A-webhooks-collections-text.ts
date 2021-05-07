import { Knex } from 'knex';
import env from '../../env';
import { oracleForceAlterColumn } from '../../utils/oracle-schema';

export async function up(knex: Knex): Promise<void> {
	if (env.DB_CLIENT === 'oracledb') {
		await oracleForceAlterColumn(knex, 'directus_webhooks', 'collections', 'CLOB', true);
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.text('collections').alter();
	});
}

export async function down(knex: Knex): Promise<void> {
	if (env.DB_CLIENT === 'oracledb') {
		await oracleForceAlterColumn(knex, 'directus_webhooks', 'collections', 'VARCHAR2(255)', true);
		return;
	}

	await knex.schema.alterTable('directus_webhooks', (table) => {
		table.string('collections').alter();
	});
}
