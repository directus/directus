import { createInspector } from '@directus/schema';
import type { Knex } from 'knex';
import { useLogger } from '../../logger/index.js';
import { getDatabaseClient } from '../index.js';

/**
 * Things to keep in mind:
 *
 * - Can't have circular constraints (field -> parent_field)
 * - Can't have two constraints from/to the same table (user_created/user_modified -> users)
 *
 * The following updates are all the times we can rely on the DB to do the cascade. The rest will
 * have to be handled in the API. I don't make the rules.
 */

const updates = [
	{
		table: 'directus_files',
		constraints: [
			{
				column: 'folder',
				references: 'directus_folders.id',
				on_delete: 'SET NULL',
			},
		],
	},
	{
		table: 'directus_permissions',
		constraints: [
			{
				column: 'role',
				references: 'directus_roles.id',
				on_delete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_presets',
		constraints: [
			{
				column: 'user',
				references: 'directus_users.id',
				on_delete: 'CASCADE',
			},
			{
				column: 'role',
				references: 'directus_roles.id',
				on_delete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_revisions',
		constraints: [
			{
				column: 'activity',
				references: 'directus_activity.id',
				on_delete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_sessions',
		constraints: [
			{
				column: 'user',
				references: 'directus_users.id',
				on_delete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_users',
		constraints: [
			{
				column: 'role',
				references: 'directus_roles.id',
				on_delete: 'SET NULL',
			},
		],
	},
];

export async function up(knex: Knex): Promise<void> {
	const logger = useLogger();

	const inspector = createInspector(knex);

	const foreignKeys = await inspector.foreignKeys();

	for (const update of updates) {
		for (const constraint of update.constraints) {
			const existingForeignKey = foreignKeys.find(
				(fk: any) =>
					fk.table === update.table &&
					fk.column === constraint.column &&
					fk.foreign_key_table === constraint.references.split('.')[0] &&
					fk.foreign_key_column === constraint.references.split('.')[1],
			);

			try {
				await knex.schema.alterTable(update.table, (table) => {
					table.dropForeign([constraint.column], existingForeignKey?.constraint_name || undefined);
				});
			} catch (err: any) {
				logger.warn(`Couldn't drop foreign key ${update.table}.${constraint.column}->${constraint.references}`);
				logger.warn(err);
			}

			/**
			 * MySQL won't delete the index when you drop the foreign key constraint. Gotta make
			 * sure to clean those up as well
			 */
			if (getDatabaseClient(knex) === 'mysql') {
				try {
					await knex.schema.alterTable(update.table, (table) => {
						// Knex uses a default convention for index names: `table_column_type`
						table.dropIndex([constraint.column], `${update.table}_${constraint.column}_foreign`);
					});
				} catch (err: any) {
					logger.warn(
						`Couldn't clean up index for foreign key ${update.table}.${constraint.column}->${constraint.references}`,
					);

					logger.warn(err);
				}
			}

			try {
				await knex.schema.alterTable(update.table, (table) => {
					table.foreign(constraint.column).references(constraint.references).onDelete(constraint.on_delete);
				});
			} catch (err: any) {
				logger.warn(`Couldn't add foreign key to ${update.table}.${constraint.column}->${constraint.references}`);
				logger.warn(err);
			}
		}
	}
}

export async function down(knex: Knex): Promise<void> {
	const logger = useLogger();

	for (const update of updates) {
		for (const constraint of update.constraints) {
			try {
				await knex.schema.alterTable(update.table, (table) => {
					table.dropForeign([constraint.column]);
				});
			} catch (err: any) {
				logger.warn(`Couldn't drop foreign key ${update.table}.${constraint.column}->${constraint.references}`);
				logger.warn(err);
			}

			/**
			 * MySQL won't delete the index when you drop the foreign key constraint. Gotta make
			 * sure to clean those up as well
			 */
			if (getDatabaseClient(knex) === 'mysql') {
				try {
					await knex.schema.alterTable(update.table, (table) => {
						// Knex uses a default convention for index names: `table_column_type`
						table.dropIndex([constraint.column], `${update.table}_${constraint.column}_foreign`);
					});
				} catch (err: any) {
					logger.warn(
						`Couldn't clean up index for foreign key ${update.table}.${constraint.column}->${constraint.references}`,
					);

					logger.warn(err);
				}
			}

			try {
				await knex.schema.alterTable(update.table, (table) => {
					table.foreign(constraint.column).references(constraint.references);
				});
			} catch (err: any) {
				logger.warn(`Couldn't add foreign key to ${update.table}.${constraint.column}->${constraint.references}`);
				logger.warn(err);
			}
		}
	}
}
