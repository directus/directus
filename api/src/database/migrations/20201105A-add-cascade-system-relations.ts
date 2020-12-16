import Knex from 'knex';

const updates = [
	{
		table: 'directus_fields',
		constraints: [
			{
				column: 'group',
				references: 'directus_fields.id',
				onDelete: 'SET NULL',
			},
		],
	},
	{
		table: 'directus_files',
		constraints: [
			{
				column: 'folder',
				references: 'directus_folders.id',
				onDelete: 'SET NULL',
			},
			{
				column: 'uploaded_by',
				references: 'directus_users.id',
				onDelete: 'SET NULL',
			},
			{
				column: 'modified_by',
				references: 'directus_users.id',
				onDelete: 'SET NULL',
			},
		],
	},
	{
		table: 'directus_folders',
		constraints: [
			{
				column: 'parent',
				references: 'directus_folders.id',
				onDelete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_permissions',
		constraints: [
			{
				column: 'role',
				references: 'directus_roles.id',
				onDelete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_presets',
		constraints: [
			{
				column: 'user',
				references: 'directus_users.id',
				onDelete: 'CASCADE',
			},
			{
				column: 'role',
				references: 'directus_roles.id',
				onDelete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_revisions',
		constraints: [
			{
				column: 'activity',
				references: 'directus_activity.id',
				onDelete: 'CASCADE',
			},
			{
				column: 'parent',
				references: 'directus_revisions.id',
				onDelete: 'SET NULL',
			},
		],
	},
	{
		table: 'directus_sessions',
		constraints: [
			{
				column: 'user',
				references: 'directus_users.id',
				onDelete: 'CASCADE',
			},
		],
	},
	{
		table: 'directus_settings',
		constraints: [
			{
				column: 'project_logo',
				references: 'directus_files.id',
				onDelete: 'SET NULL',
			},
			{
				column: 'public_foreground',
				references: 'directus_files.id',
				onDelete: 'SET NULL',
			},
			{
				column: 'public_background',
				references: 'directus_files.id',
				onDelete: 'SET NULL',
			},
		],
	},
	{
		table: 'directus_users',
		constraints: [
			{
				column: 'role',
				references: 'directus_roles.id',
				onDelete: 'SET NULL',
			},
		],
	},
];

export async function up(knex: Knex) {
	for (const update of updates) {
		await knex.schema.alterTable(update.table, (table) => {
			for (const constraint of update.constraints) {
				table.dropForeign([constraint.column]);

				table
					.foreign(constraint.column)
					.references(constraint.references)
					.onUpdate('CASCADE')
					.onDelete(constraint.onDelete);
			}
		});
	}
}

export async function down(knex: Knex) {
	for (const update of updates) {
		await knex.schema.alterTable(update.table, (table) => {
			for (const constraint of update.constraints) {
				table.dropForeign([constraint.column]);

				table.foreign(constraint.column).references(constraint.references).onUpdate('NO ACTION').onDelete('NO ACTION');
			}
		});
	}
}
