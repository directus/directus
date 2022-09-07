import type { Knex } from 'knex';
import { uniq } from 'lodash-es';

export async function up(knex: Knex): Promise<void> {
	const groupsInUse = await knex.select('id', 'group').from('directus_fields').whereNotNull('group');

	const groupIDs: number[] = uniq(groupsInUse.map(({ group }) => group));

	const groupFields = await knex.select('id', 'field').from('directus_fields').whereIn('id', groupIDs);

	const groupMap = new Map();

	for (const { id, field } of groupFields) {
		groupMap.set(id, field);
	}

	await knex.schema.alterTable('directus_fields', (table) => {
		table.dropForeign('group');
	});

	await knex.schema.alterTable('directus_fields', (table) => {
		table.dropColumn('group');
	});

	await knex.schema.alterTable('directus_fields', (table) => {
		table.string('group', 64);
	});

	for (const { id, group } of groupsInUse) {
		await knex('directus_fields')
			.update({ group: groupMap.get(group) })
			.where({ id });
	}
}

export async function down(knex: Knex): Promise<void> {
	const fieldsThatUseAGroup = await knex
		.select('id', 'collection', 'group')
		.from('directus_fields')
		.whereNotNull('group');

	if (fieldsThatUseAGroup.length === 0) return;

	const groupMap = new Map();

	for (const { collection, group } of fieldsThatUseAGroup) {
		const { id } = await knex.select('id').from('directus_fields').where({ collection, field: group }).first();

		groupMap.set(group, id);
	}

	await knex.schema.alterTable('directus_fields', (table) => {
		table.dropColumn('group');
	});

	await knex.schema.alterTable('directus_fields', (table) => {
		table.integer('group').references('id').inTable('directus_fields');
	});

	for (const { id, group } of fieldsThatUseAGroup) {
		await knex('directus_fields')
			.update({ group: groupMap.get(group) })
			.where({ id });
	}
}
