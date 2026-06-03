import { createInspector } from '@directus/schema';
import type { Knex } from 'knex';
import getLocalType from '../../utils/get-local-type.js';
import { getDatabaseClient } from '../index.js';

// Local types that can hold a user UUID reference. Postgres exposes a native `uuid` type, while MySQL/SQLite store
// UUIDs as char/varchar (resolved as `string`/`text`).
const UUID_COMPATIBLE_TYPES = ['uuid', 'string', 'text'];

export async function up(knex: Knex): Promise<void> {
	const isSQLite = getDatabaseClient(knex) === 'sqlite';
	const inspector = createInspector(knex);

	// Avoid "duplicate column" errors for instances that may have manually added these fields through the app.
	const [hasDateCreated, hasDateUpdated, hasUserCreated, hasUserUpdated] = await Promise.all([
		knex.schema.hasColumn('directus_users', 'date_created'),
		knex.schema.hasColumn('directus_users', 'date_updated'),
		knex.schema.hasColumn('directus_users', 'user_created'),
		knex.schema.hasColumn('directus_users', 'user_updated'),
	]);

	// Fail fast if a pre-existing user_created/user_updated column has a type that can't hold a user UUID.
	for (const field of ['user_created', 'user_updated'] as const) {
		const exists = field === 'user_created' ? hasUserCreated : hasUserUpdated;
		if (!exists) continue;

		const column = await inspector.columnInfo('directus_users', field);
		const localType = getLocalType(column);

		if (!UUID_COMPATIBLE_TYPES.includes(localType)) {
			throw new Error(
				`Cannot add user tracking to directus_users: the existing "${field}" column has type "${column.data_type}" ` +
					`(resolved as "${localType}"), which cannot hold a user reference. Change it to a UUID column (or remove ` +
					`it so this migration can create it), then re-run migrations.`,
			);
		}
	}

	await knex.schema.alterTable('directus_users', (table) => {
		// Workaround as sqlite doesn't allow for adding a column with non-constant default and knex doesn't resolve this by itself.
		if (isSQLite) {
			if (!hasDateCreated) table.timestamp('date_created').nullable();
			if (!hasDateUpdated) table.timestamp('date_updated').nullable();
		} else {
			if (!hasDateCreated) table.timestamp('date_created').defaultTo(knex.fn.now());
			if (!hasDateUpdated) table.timestamp('date_updated').defaultTo(knex.fn.now());
		}

		if (!hasUserCreated) table.uuid('user_created').references('id').inTable('directus_users').onDelete('SET NULL');
		if (!hasUserUpdated) table.uuid('user_updated').references('id').inTable('directus_users').onDelete('SET NULL');
	});

	// These fields are now system-managed. Remove any directus_fields rows the user created for them through the
	// app so the system field definitions take over cleanly.
	await knex('directus_fields')
		.where('collection', 'directus_users')
		.whereIn('field', ['date_created', 'date_updated', 'user_created', 'user_updated'])
		.delete();

	// user_created/user_updated are now defined in system-data. Remove any directus_relations rows
	// that may have been manually created for them through the app to avoid duplicates.
	await knex('directus_relations')
		.where('many_collection', 'directus_users')
		.whereIn('many_field', ['user_created', 'user_updated'])
		.delete();
}

export async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable('directus_users', (table) => {
		table.dropColumn('date_created');
		table.dropColumn('date_updated');
		table.dropColumn('user_created');
		table.dropColumn('user_updated');
	});
}
