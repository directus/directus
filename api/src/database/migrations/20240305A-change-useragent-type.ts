import { getHelpers } from '../helpers/index.js';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	await Promise.all([
		helper.changeToType('directus_activity', 'user_agent', 'text'),
		helper.changeToType('directus_sessions', 'user_agent', 'text'),
	]);
}

export async function down(knex: Knex): Promise<void> {
	const helper = getHelpers(knex).schema;

	const opts = {
		nullable: false,
		length: 255,
	};

	await Promise.all([
		helper.changeToType('directus_activity', 'user_agent', 'string', opts),
		helper.changeToType('directus_sessions', 'user_agent', 'string', opts),
	]);
}
