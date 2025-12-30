import { getHelpers } from '../helpers/index.js';
import { Action } from '@directus/constants';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	const helpers = getHelpers(knex);

	await knex.schema.createTable('directus_comments', (table) => {
		table.uuid('id').primary().notNullable();

		table.string('collection', helpers.schema.getTableNameMaxLength()).notNullable();

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
	const rowsLimit = 50;
	let hasMore = true;

	while (hasMore) {
		const comments = await knex
			.select('id', 'collection', 'item', 'comment', 'date_created', 'user_created')
			.from('directus_comments')
			.limit(rowsLimit);

		if (comments.length === 0) {
			hasMore = false;
			break;
		}

		await knex.transaction(async (trx) => {
			for (const comment of comments) {
				const migratedRecords = await trx('directus_activity')
					.select('id')
					.where('collection', '=', 'directus_comments')
					.andWhere('item', '=', comment.id)
					.andWhere('action', '=', Action.CREATE)
					.limit(1);

				if (migratedRecords[0]) {
					await trx('directus_activity')
						.update({
							action: Action.COMMENT,
							collection: comment.collection,
							item: comment.item,
							comment: comment.comment,
						})
						.where('id', '=', migratedRecords[0].id);
				} else {
					await trx('directus_activity').insert({
						action: Action.COMMENT,
						collection: comment.collection,
						item: comment.item,
						comment: comment.comment,
						user: comment.user_created,
						timestamp: comment.date_created,
					});
				}

				await trx('directus_comments').where('id', '=', comment.id).delete();
			}
		});
	}

	await knex.schema.dropTable('directus_comments');
}
