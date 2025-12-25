import { Permission } from '@directus/types';

export const appRecommendedPermissions: Partial<Permission>[] = [
	{
		collection: 'directus_comments',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
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
		collection: 'directus_dashboards',
		action: 'create',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_dashboards',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_dashboards',
		action: 'update',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_dashboards',
		action: 'delete',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_panels',
		action: 'create',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_panels',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_panels',
		action: 'update',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_panels',
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
		fields: ['*'],
	},
	{
		collection: 'directus_users',
		action: 'update',
		permissions: {
			id: {
				_eq: '$CURRENT_USER',
			},
		},
		fields: [
			'first_name',
			'last_name',
			'email',
			'password',
			'location',
			'title',
			'description',
			'avatar',
			'language',
			'appearance',
			'theme_light',
			'theme_dark',
			'theme_light_overrides',
			'theme_dark_overrides',
			'tfa_secret',
		],
	},
	{
		collection: 'directus_roles',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_shares',
		action: 'read',
		permissions: {
			_or: [
				{
					// TODO should this be _in $CURRENT_ROLES?
					role: {
						_eq: '$CURRENT_ROLE',
					},
				},
				{
					role: {
						_null: true,
					},
				},
			],
		},
		fields: ['*'],
	},
	{
		collection: 'directus_shares',
		action: 'create',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_shares',
		action: 'update',
		permissions: {
			user_created: {
				_eq: '$CURRENT_USER',
			},
		},
		fields: ['*'],
	},
	{
		collection: 'directus_shares',
		action: 'delete',
		permissions: {
			user_created: {
				_eq: '$CURRENT_USER',
			},
		},
		fields: ['*'],
	},
	{
		collection: 'directus_flows',
		action: 'read',
		permissions: {
			trigger: {
				_eq: 'manual',
			},
		},
		fields: ['id', 'status', 'name', 'icon', 'color', 'options', 'trigger'],
	},
	{
		collection: 'directus_minis',
		action: 'create',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_minis',
		action: 'read',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_minis',
		action: 'update',
		permissions: {},
		fields: ['*'],
	},
	{
		collection: 'directus_minis',
		action: 'delete',
		permissions: {},
		fields: ['*'],
	},
];

export const editablePermissionActions = ['create', 'read', 'update', 'delete', 'share'] as const;
export type EditablePermissionsAction = (typeof editablePermissionActions)[number];

export const disabledActions: Record<string, EditablePermissionsAction[]> = {
	directus_extensions: ['create', 'delete'],
};
