import * as Knex from 'knex';
import { v4 as uuidv4 } from 'uuid';

const systemData = [
	{
		table: 'directus_collections',
		rows: [
			{
				collection: 'directus_activity',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_collections',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_fields',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_files',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_folders',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_permissions',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_presets',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_relations',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_revisions',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_roles',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_sessions',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_settings',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_users',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
			{
				collection: 'directus_webhooks',
				hidden: false,
				single: false,
				icon: null,
				note: null,
				translation: null,
			},
		],
	},
	{
		table: 'directus_fields',
		rows: [
			/**
			 * @todo add final system fields setup for admin app
			 */
		],
	},
	{
		table: 'directus_relations',
		rows: [
			{
				collection_many: 'directus_activity',
				field_many: 'action_by',
				primary_many: 'id',
				collection_one: 'directus_users',
				field_one: null,
				primary_one: 'id',
				junction_field: null,
			},
			{
				collection_many: 'directus_fields',
				field_many: 'collection',
				primary_many: 'collection',
				collection_one: 'directus_collections',
				field_one: 'fields',
				primary_one: 'id',
				junction_field: null,
			},
			{
				collection_many: 'directus_files',
				field_many: 'folder',
				primary_many: 'id',
				collection_one: 'directus_folders',
				field_one: null,
				primary_one: 'id',
				junction_field: null,
			},
			{
				collection_many: 'directus_files',
				field_many: 'uploaded_by',
				primary_many: 'id',
				collection_one: 'directus_users',
				field_one: null,
				primary_one: 'id',
				junction_field: null,
			},
			{
				collection_many: 'directus_folders',
				field_many: 'parent_folder',
				primary_many: 'id',
				collection_one: 'directus_folders',
				field_one: null,
				primary_one: 'id',
				junction_field: null,
			},
			{
				collection_many: 'directus_presets',
				field_many: 'user',
				primary_many: 'id',
				collection_one: 'directus_users',
				field_one: null,
				primary_one: 'id',
				junction_field: null,
			},
			{
				collection_many: 'directus_revisions',
				field_many: 'activity',
				primary_many: 'id',
				collection_one: 'directus_activity',
				field_one: null,
				primary_one: 'id',
				junction_field: null,
			},
			{
				collection_many: 'directus_users',
				field_many: 'avatar',
				primary_many: 'id',
				collection_one: 'directus_files',
				field_one: null,
				primary_one: 'id',
				junction_field: null,
			},
			{
				collection_many: 'directus_users',
				field_many: 'role',
				primary_many: 'id',
				collection_one: 'directus_roles',
				field_one: null,
				primary_one: 'id',
				junction_field: null,
			},
		],
	},
	{
		table: 'directus_roles',
		rows: [
			{
				id: uuidv4(),
				name: 'Admin',
				description: null,
				ip_whitelist: null,
				enforce_2fa: false,
				module_listing: null,
				collection_listing: null,
				admin: true,
				app_access: true,
			},
		],
	},
	{
		table: 'directus_settings',
		rows: [
			{
				id: 1,
				project_name: 'Directus',
				project_url: null,
				project_color: '#2d6cc0',
				asset_shortcuts: [],
				asset_generation: 'all',
				project_foreground: null,
				project_background: null,
			},
		],
	},
];

export async function seed(knex: Knex): Promise<any> {
	for (const { table, rows } of systemData) {
		console.log(table, rows);
		await knex(table).insert(rows);
	}
}
