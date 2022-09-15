import type { Knex } from 'knex';

const updates = [
	{
		table: 'directus_fields',
		constraints: [
			{
				column: 'group',
				references: 'directus_fields.id',
			},
		],
	},
	{
		table: 'directus_files',
		constraints: [
			{
				column: 'folder',
				references: 'directus_folders.id',
			},
			{
				column: 'uploaded_by',
				references: 'directus_users.id',
			},
			{
				column: 'modified_by',
				references: 'directus_users.id',
			},
		],
	},
	{
		table: 'directus_folders',
		constraints: [
			{
				column: 'parent',
				references: 'directus_folders.id',
			},
		],
	},
	{
		table: 'directus_permissions',
		constraints: [
			{
				column: 'role',
				references: 'directus_roles.id',
			},
		],
	},
	{
		table: 'directus_presets',
		constraints: [
			{
				column: 'user',
				references: 'directus_users.id',
			},
			{
				column: 'role',
				references: 'directus_roles.id',
			},
		],
	},
	{
		table: 'directus_revisions',
		constraints: [
			{
				column: 'activity',
				references: 'directus_activity.id',
			},
			{
				column: 'parent',
				references: 'directus_revisions.id',
			},
		],
	},
	{
		table: 'directus_sessions',
		constraints: [
			{
				column: 'user',
				references: 'directus_users.id',
			},
		],
	},
	{
		table: 'directus_settings',
		constraints: [
			{
				column: 'project_logo',
				references: 'directus_files.id',
			},
			{
				column: 'public_foreground',
				references: 'directus_files.id',
			},
			{
				column: 'public_background',
				references: 'directus_files.id',
			},
		],
	},
	{
		table: 'directus_users',
		constraints: [
			{
				column: 'role',
				references: 'directus_roles.id',
			},
		],
	},
];

/**
 * NOTE:
 * Not all databases allow (or support) recursive onUpdate/onDelete triggers. MS SQL / Oracle flat out deny creating them,
 * Postgres behaves erratic on those triggers, not sure if MySQL / Maria plays nice either.
 */

export async function up(knex: Knex): Promise<void> {
	for (const update of updates) {
		await knex.schema.alterTable(update.table, (table) => {
			for (const constraint of update.constraints) {
				table.dropForeign([constraint.column]);
				table.foreign(constraint.column).references(constraint.references);
			}
		});
	}
}

export async function down(knex: Knex): Promise<void> {
	for (const update of updates) {
		await knex.schema.alterTable(update.table, (table) => {
			for (const constraint of update.constraints) {
				table.dropForeign([constraint.column]);
			}
		});
	}
}
