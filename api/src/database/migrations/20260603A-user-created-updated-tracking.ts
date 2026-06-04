import type { Knex } from 'knex';
import { useLogger } from '../../logger/index.js';
import { getDatabaseClient } from '../index.js';

const TRACKING_COLUMNS = ['date_created', 'date_updated', 'user_created', 'user_updated'] as const;

export async function up(knex: Knex): Promise<void> {
	const logger = useLogger();
	const isSQLite = getDatabaseClient(knex) === 'sqlite';

	const existing = (
		await Promise.all(TRACKING_COLUMNS.map((column) => knex.schema.hasColumn('directus_users', column)))
	).flatMap((exists, index) => (exists ? [TRACKING_COLUMNS[index]!] : []));

	if (existing.length > 0) {
		logger.warn(
			`The following columns already exist on "directus_users" and were not created by this migration: ${existing.join(
				', ',
			)}. These fields are now system-managed by Directus. Please remove your existing columns and recreate them to match ` +
				`the system field definitions (date_created/date_updated: timestamp defaulting to now; user_created/user_updated: ` +
				`uuid with a foreign key to directus_users.id, ON DELETE SET NULL).`,
		);
	}

	await knex.schema.alterTable('directus_users', (table) => {
		// Workaround as sqlite doesn't allow for adding a column with non-constant default and knex doesn't resolve this by itself.
		if (isSQLite) {
			if (!existing.includes('date_created')) table.timestamp('date_created').nullable();
			if (!existing.includes('date_updated')) table.timestamp('date_updated').nullable();
		} else {
			if (!existing.includes('date_created')) table.timestamp('date_created').defaultTo(knex.fn.now());
			if (!existing.includes('date_updated')) table.timestamp('date_updated').defaultTo(knex.fn.now());
		}

		if (!existing.includes('user_created')) {
			table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
		}

		if (!existing.includes('user_updated')) {
			table.uuid('user_updated').references('id').inTable('directus_users').onDelete('SET NULL');
		}
	});
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.dropColumn('date_created');
		table.dropColumn('date_updated');
		table.dropColumn('user_created');
		table.dropColumn('user_updated');
	});
}
