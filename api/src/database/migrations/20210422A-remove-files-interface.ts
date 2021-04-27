import { Knex } from 'knex';

export async function up(knex: Knex) {
	await knex('directus_fields').update({ interface: 'many-to-many' }).where({ interface: 'files' });
}

export async function down(knex: Knex) {}
