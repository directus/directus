import { Knex } from 'knex';
import { toArray } from '@directus/shared/utils';
import { v4 as uuidv4 } from 'uuid';
import { parseJSON } from '../../utils/parse-json';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_flows', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('name').notNullable();
		table.string('icon', 30);
		table.string('color').nullable();
		table.text('note');
		table.string('status').notNullable().defaultTo('active');
		table.string('trigger');
		table.json('options');
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
		table.uuid('operation').unique();
	});

	await knex.schema.createTable('directus_operations', (table) => {
		table.uuid('id').primary().notNullable();
		table.string('name');
		table.string('key').notNullable();
		table.string('type').notNullable();
		table.integer('position_x').notNullable();
		table.integer('position_y').notNullable();
		table.json('options');
		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
	});

	await knex.schema.alterTable('directus_operations', (table) => {
		table.uuid('resolve').unique().references('id').inTable('directus_operations').onDelete('SET NULL');
		table.uuid('reject').unique().references('id').inTable('directus_operations').onDelete('SET NULL');
		table.uuid('flow').notNullable().references('id').inTable('directus_flows').onDelete('CASCADE');
	});

	const webhooks = await knex.select('*').from('directus_webhooks');

	const flows = [];
	const operations = [];

	for (const webhook of webhooks) {
		const flowID = uuidv4();

		flows.push({
			id: flowID,
			name: webhook.name,
			status: webhook.status,
			trigger: 'hook',
			options: JSON.stringify({
				name: webhook.name,
				type: 'action',
				actionScope: toArray(webhook.actions).map((scope) => `items.${scope}`),
				actionCollections: toArray(webhook.collections),
			}),
		});

		operations.push({
			id: uuidv4(),
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

	await knex.schema.dropTable('directus_webhooks');
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTable('directus_operations');
	await knex.schema.dropTable('directus_flows');

	await knex.schema.createTable('directus_webhooks', (table) => {
		table.increments();
		table.string('name').notNullable();
		table.string('method', 10).notNullable().defaultTo('POST');
		table.string('url').notNullable();
		table.string('status', 10).notNullable().defaultTo('active');
		table.boolean('data').notNullable().defaultTo(true);
		table.string('actions', 100).notNullable();
		table.string('collections').notNullable();
		table.json('headers').nullable();
	});
}
