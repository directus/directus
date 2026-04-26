import { createInspector } from '@directus/schema';
import type { Knex } from 'knex';
import { useLogger } from '../../logger/index.js';
import { getDatabaseClient } from '../index.js';

/**
 * Change the `directus_revisions.parent` foreign key to use `ON DELETE SET NULL`.
 *
 * Without this, the retention job that deletes old `directus_activity` rows
 * (which cascade-deletes their associated `directus_revisions`) fails with a
 * foreign-key violation whenever a newer revision outside the retention window
 * references a deleted revision as its `parent`.
 *
 * Circular self-referential constraints with cascade actions are unsupported by
 * some databases (notably MS SQL Server / Oracle), so we deliberately avoid
 * `ON DELETE CASCADE` here and use `SET NULL` instead.
 *
 * @see https://github.com/directus/directus/issues/26747
 */

const TABLE = 'directus_revisions';
const COLUMN = 'parent';
const REFERENCES = 'directus_revisions.id';

export async function up(knex: Knex): Promise<void> {
	const logger = useLogger();
	const inspector = createInspector(knex);
	const foreignKeys = await inspector.foreignKeys();

	const existingFk = foreignKeys.find(
		(fk: any) => fk.table === TABLE && fk.column === COLUMN && fk.foreign_key_table === TABLE,
	);

	// Drop existing FK (no ON DELETE action)
	try {
		await knex.schema.alterTable(TABLE, (table) => {
			table.dropForeign([COLUMN], existingFk?.constraint_name || undefined);
		});
	} catch (err: any) {
		logger.warn(`Couldn't drop foreign key ${TABLE}.${COLUMN}->${REFERENCES}: ${err.message}`);
	}

	// MySQL doesn't automatically drop the index when the FK is dropped
	if (getDatabaseClient(knex) === 'mysql') {
		try {
			await knex.schema.alterTable(TABLE, (table) => {
				table.dropIndex([COLUMN], `${TABLE}_${COLUMN}_foreign`);
			});
		} catch (err: any) {
			logger.warn(`Couldn't clean up index for foreign key ${TABLE}.${COLUMN}->${REFERENCES}: ${err.message}`);
		}
	}

	// Recreate FK with ON DELETE SET NULL
	try {
		await knex.schema.alterTable(TABLE, (table) => {
			table.foreign(COLUMN).references(REFERENCES).onDelete('SET NULL');
		});
	} catch (err: any) {
		logger.warn(`Couldn't add foreign key to ${TABLE}.${COLUMN}->${REFERENCES}: ${err.message}`);
	}
}

export async function down(knex: Knex): Promise<void> {
	const logger = useLogger();
	const inspector = createInspector(knex);
	const foreignKeys = await inspector.foreignKeys();

	const existingFk = foreignKeys.find(
		(fk: any) => fk.table === TABLE && fk.column === COLUMN && fk.foreign_key_table === TABLE,
	);

	// Drop SET NULL FK
	try {
		await knex.schema.alterTable(TABLE, (table) => {
			table.dropForeign([COLUMN], existingFk?.constraint_name || undefined);
		});
	} catch (err: any) {
		logger.warn(`Couldn't drop foreign key ${TABLE}.${COLUMN}->${REFERENCES}: ${err.message}`);
	}

	if (getDatabaseClient(knex) === 'mysql') {
		try {
			await knex.schema.alterTable(TABLE, (table) => {
				table.dropIndex([COLUMN], `${TABLE}_${COLUMN}_foreign`);
			});
		} catch (err: any) {
			logger.warn(`Couldn't clean up index for foreign key ${TABLE}.${COLUMN}->${REFERENCES}: ${err.message}`);
		}
	}

	// Restore original FK (no ON DELETE action)
	try {
		await knex.schema.alterTable(TABLE, (table) => {
			table.foreign(COLUMN).references(REFERENCES);
		});
	} catch (err: any) {
		logger.warn(`Couldn't restore foreign key to ${TABLE}.${COLUMN}->${REFERENCES}: ${err.message}`);
	}
}
