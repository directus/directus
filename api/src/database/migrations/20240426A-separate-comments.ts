import { Action } from '@directus/constants';
import type { Knex } from 'knex';
import { randomUUID } from 'node:crypto';

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

	let lastId = 0;
	let commentsFound = 0;

	do {
		const comments = await knex
			.select('id', 'collection', 'item', 'comment', 'user', 'timestamp')
			.from('directus_activity')
			.whereNotNull('comment')
			.andWhere('id', '>', lastId)
			.orderBy('id')
			.limit(100);

		commentsFound = comments.length;

		for (const comment of comments) {
			await knex.transaction(async (trx) => {
				const newCommentId = randomUUID();

				await trx('directus_comments').insert({
					id: newCommentId,
					collection: comment.collection,
					item: comment.item,
					comment: comment.comment,
					user_created: comment.user,
					date_created: comment.timestamp,
				});

				await trx('directus_activity')
					.update({
						action: Action.CREATE,
						collection: 'directus_comments',
						item: newCommentId,
						comment: null,
					})
					.where('id', '=', comment.id);
			});

			lastId = comment.id;
		}
	} while (commentsFound > 0);
}

export async function down(knex: Knex): Promise<void> {
	const comments = await knex
		.select('id', 'collection', 'item', 'comment', 'date_created', 'user_created')
		.from('directus_comments');

	for (const comment of comments) {
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

			continue;
		}

		const unmigratedRecords = await knex('directus_activity')
			.select('id')
			.where('collection', '=', comment.collection)
			.andWhere('item', '=', comment.item)
			.andWhere('action', '=', Action.COMMENT)
			.limit(1);

		if (unmigratedRecords[0]) {
			await knex('directus_activity')
				.update({
					comment: comment.comment,
				})
				.where('id', '=', unmigratedRecords[0].id);

			continue;
		}

		await knex('directus_activity').insert({
			action: Action.COMMENT,
			collection: comment.collection,
			item: comment.item,
			comment: comment.comment,
			user: comment.user_created,
			timestamp: comment.date_created,
		});
	}

	await knex.schema.dropTable('directus_comments');
}
