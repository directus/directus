import { parseJSON, toArray } from '@directus/utils';
import type { Knex } from 'knex';
import { v4 as uuid } from 'uuid';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_flows', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('name').notNullable();
		table.string('icon', 30);
		table.string('color').nullable();
		table.text('description');
		table.string('status').notNullable().defaultTo('active');
		table.string('trigger');
		table.string('accountability').defaultTo('all');
		table.json('options');
		table.uuid('operation').unique();
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
	});

	await knex.schema.createTable('directus_operations', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('name');
		table.string('key').notNullable();
		table.string('type').notNullable();
		table.integer('position_x').notNullable();
		table.integer('position_y').notNullable();
		table.json('options');
		table.uuid('resolve').unique().references('id').inTable('directus_operations');
		table.uuid('reject').unique().references('id').inTable('directus_operations');
		table.uuid('flow').notNullable().references('id').inTable('directus_flows').onDelete('CASCADE');
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
	});

	const webhooks = await knex.select('*').from('directus_webhooks');

	const flows = [];
	const operations = [];

	for (const webhook of webhooks) {
		const flowID = uuid();

		flows.push({
			id: flowID,
			name: webhook.name,
			status: 'inactive',
			trigger: 'hook',
			options: JSON.stringify({
				name: webhook.name,
				type: 'action',
				scope: toArray(webhook.actions).map((scope) => `items.${scope}`),
				collections: toArray(webhook.collections),
			}),
		});

		operations.push({
			id: uuid(),
			name: 'Request',
			key: 'request',
			type: 'request',
			position_x: 21,
			position_y: 1,
			options: JSON.stringify({
				url: webhook.url,
				headers: typeof webhook.headers === 'string' ? parseJSON(webhook.headers) : webhook.headers,
				data: webhook.data ? '{{$trigger}}' : null,
				method: webhook.method,
			}),
			date_created: new Date(),
			flow: flowID,
		});
	}

	if (flows.length && operations.length) {
		await knex.insert(flows).into('directus_flows');
		await knex.insert(operations).into('directus_operations');

		for (const operation of operations) {
			await knex('directus_flows').update({ operation: operation.id }).where({ id: operation.flow });
		}
	}
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_operations');
	await knex.schema.dropTable('directus_flows');
}
