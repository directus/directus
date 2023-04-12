import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex('directus_presets').update({ icon: 'bookmark_border' }).where('icon', '=', 'bookmark_outline');
}

export async function down(knex: Knex): Promise<void> {
	await knex('directus_presets').update({ icon: 'bookmark_outline' }).where('icon', '=', 'bookmark_border');
}
