import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_roles', (table) => {
		table.dropColumn('module_list');
	});

	await knex.schema.alterTable('directus_settings', (table) => {
		table.json('module_bar').defaultTo(
			JSON.stringify([
				{
					type: 'module',
					id: 'collections',
					enabled: true,
				},
				{
					type: 'module',
					id: 'users',
					enabled: true,
				},
				{
					type: 'module',
					id: 'files',
					enabled: true,
				},
				{
					type: 'module',
					id: 'insights',
					enabled: false,
				},
				{
					type: 'module',
					id: 'docs',
					enabled: true,
				},
				{
					type: 'module',
					id: 'settings',
					enabled: true,
					locked: true,
				},
			])
		);
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_roles', (table) => {
		table.json('module_list');
	});

	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('module_bar');
	});
}
