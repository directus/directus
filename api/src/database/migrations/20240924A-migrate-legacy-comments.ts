import { randomUUID } from 'node:crypto';
import { Action } from '@directus/constants';
import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
	// remove foreign key constraint for projects already migrated to retentions-p1
	try {
		await knex.schema.alterTable('directus_comments', (table) => {
			table.dropForeign('collection');
		});
	} catch {
		// ignore
	}

	const rowsLimit = 50;
	let hasMore = true;

	const existingUsers = new Set();
	const missingUsers = new Set();

	while (hasMore) {
		const legacyComments = await knex
			.select('*')
			.from('directus_activity')
			.where('action', '=', Action.COMMENT)
			.limit(rowsLimit);

		if (legacyComments.length === 0) {
			hasMore = false;
			break;
		}

		await knex.transaction(async (trx) => {
			for (const legacyComment of legacyComments) {
				let primaryKey;

				// Migrate legacy comment
				if (legacyComment['action'] === Action.COMMENT) {
					primaryKey = randomUUID();

					let legacyCommentUserId = legacyComment.user;

					if (legacyCommentUserId) {
						if (missingUsers.has(legacyCommentUserId)) {
							legacyCommentUserId = null;
						} else if (!existingUsers.has(legacyCommentUserId)) {
							const userExists = await trx
								.select('id')
								.from('directus_users')
								.where('id', '=', legacyCommentUserId)
								.first();

							if (userExists) {
								existingUsers.add(legacyCommentUserId);
							} else {
								missingUsers.add(legacyCommentUserId);
								legacyCommentUserId = null;
							}
						}
					}

					await trx('directus_comments').insert({
						id: primaryKey,
						collection: legacyComment.collection,
						item: legacyComment.item,
						comment: legacyComment.comment,
						user_created: legacyCommentUserId,
						date_created: legacyComment.timestamp,
					});

					await trx('directus_activity')
						.update({
							action: Action.CREATE,
							collection: 'directus_comments',
							item: primaryKey,
							comment: null,
						})
						.where('id', '=', legacyComment.id);
				}
			}
		});
	}

	await knex.schema.alterTable('directus_activity', (table) => {
		table.dropColumn('comment');
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_activity', (table) => {
		table.text('comment');
	});
}
