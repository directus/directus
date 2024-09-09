import { Action } from '@directus/constants';
import { processChunk } from '@directus/utils';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable('directus_comments', (table) => {
		table.uuid('id').primary().notNullable();

		table
			.string('collection', 64)
			.notNullable()
			.references('collection')
			.inTable('directus_collections')
			.onDelete('CASCADE');

		table.string('item').notNullable();
		table.text('comment').notNullable();

		table.timestamp('date_created').defaultTo(knex.fn.now());
		table.timestamp('date_updated').defaultTo(knex.fn.now());
		table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
		// Cannot have two constraints from/to the same table, handled on API side
		table.uuid('user_updated').references('id').inTable('directus_users');
	});
}

export async function down(knex: Knex): Promise<void> {
	const comments = await knex
		.select('id', 'collection', 'item', 'comment', 'date_created', 'user_created')
		.from('directus_comments');

	await processChunk(comments, 100, async (commentChunk) => {
		for (const comment of commentChunk) {
			const migratedRecords = await knex('directus_activity')
				.select('id')
				.where('collection', '=', 'directus_comments')
				.andWhere('item', '=', comment.id)
				.andWhere('action', '=', Action.CREATE)
				.limit(1);

			if (migratedRecords[0]) {
				await knex('directus_activity')
					.update({
						action: Action.COMMENT,
						collection: comment.collection,
						item: comment.item,
						comment: comment.comment,
					})
					.where('id', '=', migratedRecords[0].id);
			} else {
				await knex('directus_activity').insert({
					action: Action.COMMENT,
					collection: comment.collection,
					item: comment.item,
					comment: comment.comment,
					user: comment.user_created,
					timestamp: comment.date_created,
				});
			}
		}
	});

	await knex.schema.dropTable('directus_comments');
}
