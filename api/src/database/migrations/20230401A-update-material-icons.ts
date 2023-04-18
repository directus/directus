import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToType('directus_presets', 'icon', 'string', {
		nullable: true,
		default: 'bookmark',
		length: 30,
	});

	await knex('directus_presets').update({ icon: 'bookmark_border' }).where('icon', '=', 'bookmark_outline');
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToType('directus_presets', 'icon', 'string', {
		nullable: true,
		default: 'bookmark_outline',
		length: 30,
	});

	await knex('directus_presets').update({ icon: 'bookmark_outline' }).where('icon', '=', 'bookmark_border');
}
