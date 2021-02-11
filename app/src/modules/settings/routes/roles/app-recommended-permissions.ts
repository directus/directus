import { Permission } from '@/types';

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
	},
	{
		collection: 'directus_users',
		action: 'read',
		permissions: {},
	},
];
