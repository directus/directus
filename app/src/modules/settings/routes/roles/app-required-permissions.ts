import { Permission } from '@/types';

export const appRequiredPermissions: Partial<Permission>[] = [
	{
		collection: 'directus_activity',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_collections',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_fields',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_presets',
		action: 'create',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_presets',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_presets',
		action: 'update',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_presets',
		action: 'delete',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_relations',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_revisions',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_users',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_roles',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_settings',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
];

export const appRecommendedPermissions: Partial<Permission>[] = [
	{
		collection: 'directus_files',
		action: 'create',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_files',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_files',
		action: 'update',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_files',
		action: 'delete',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_folders',
		action: 'create',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_folders',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_folders',
		action: 'update',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_folders',
		action: 'delete',
		permissions: {},
		fields: ['*'],
	},
];

export const permissions = [...appRequiredPermissions, ...appRecommendedPermissions];
