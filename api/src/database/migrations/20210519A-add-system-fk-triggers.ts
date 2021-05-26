import { Knex } from 'knex';

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
	for (const update of updates) {
		await knex.schema.alterTable(update.table, (table) => {
			for (const constraint of update.constraints) {
				table.dropForeign([constraint.column]);
				table.foreign(constraint.column).references(constraint.references).onDelete(constraint.on_delete);
			}
		});
	}
}

export async function down(knex: Knex): Promise<void> {
	for (const update of updates) {
		await knex.schema.alterTable(update.table, (table) => {
			for (const constraint of update.constraints) {
				table.dropForeign([constraint.column]);
				table.foreign(constraint.column).references(constraint.references);
			}
		});
	}
}
