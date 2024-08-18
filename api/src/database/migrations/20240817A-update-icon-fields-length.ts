import type { Knex } from 'knex';
import { getHelpers } from '../helpers/index.js';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToType('directus_collections', 'icon', 'string', {
		length: 64,
	});

	await helper.changeToType('directus_dashboards', 'icon', 'string', {
		nullable: false,
		default: 'dashboard',
		length: 64,
	});

	await helper.changeToType('directus_flows', 'icon', 'string', {
		length: 64,
	});

	await helper.changeToType('directus_panels', 'icon', 'string', {
		default: null,
		length: 64,
	});

	await helper.changeToType('directus_presets', 'icon', 'string', {
		default: 'bookmark',
		length: 64,
	});

	await helper.changeToType('directus_roles', 'icon', 'string', {
		nullable: false,
		default: 'supervised_user_circle',
		length: 64,
	});
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await helper.changeToType('directus_collections', 'icon', 'string', {
		length: 30,
	});

	await helper.changeToType('directus_dashboards', 'icon', 'string', {
		nullable: false,
		default: 'dashboard',
		length: 30,
	});

	await helper.changeToType('directus_flows', 'icon', 'string', {
		length: 30,
	});

	await helper.changeToType('directus_panels', 'icon', 'string', {
		default: null,
		length: 30,
	});

	await helper.changeToType('directus_presets', 'icon', 'string', {
		default: 'bookmark',
		length: 30,
	});

	await helper.changeToType('directus_roles', 'icon', 'string', {
		nullable: false,
		default: 'supervised_user_circle',
		length: 30,
	});
}
