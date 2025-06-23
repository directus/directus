import type { Knex } from 'knex';
import { v7 as uuid } from 'uuid';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.uuid('project_id');
	});

	const existing = await knex('directus_settings').select('id').first();
	const timestamp = await knex<{ timestamp: string }>('directus_migrations').select('timestamp').first();
	const msecs = timestamp ? new Date(timestamp.timestamp).getTime() : Date.now();

	if (existing) {
		await knex('directus_settings').update({
			project_id: uuid({
				msecs,
			}),
		});
	} else {
		await knex('directus_settings').insert({
			project_id: uuid(),
		});
	}
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_settings', (table) => {
		table.dropColumn('project_id');
	});
}
