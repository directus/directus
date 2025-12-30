import { getDatabaseClient } from '../index.js';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	if (getDatabaseClient(knex) === 'mysql') {
		// Knex creates invalid statement on MySQL, see https://github.com/knex/knex/issues/1888
		await knex.schema.raw(
			'ALTER TABLE `directus_files` CHANGE `uploaded_on` `created_on` TIMESTAMP NOT NULL DEFAULT current_timestamp();',
		);
	} else {
		await knex.schema.alterTable('directus_files', (table) => {
			table.renameColumn('uploaded_on', 'created_on');
		});
	}

	await knex.schema.alterTable('directus_files', (table) => {
		table.timestamp('uploaded_on');
	});

	await knex('directus_files').update('uploaded_on', knex.ref('created_on'));
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_files', (table) => {
		table.dropColumn('uploaded_on');
	});

	if (getDatabaseClient(knex) === 'mysql') {
		await knex.schema.raw(
			'ALTER TABLE `directus_files` CHANGE `created_on` `uploaded_on` TIMESTAMP NOT NULL DEFAULT current_timestamp();',
		);
	} else {
		await knex.schema.alterTable('directus_files', (table) => {
			table.renameColumn('created_on', 'uploaded_on');
		});
	}
}
