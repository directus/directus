import { Permission } from '@directus/types';

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
			'theme',
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
		fields: ['id', 'name', 'icon', 'color', 'options', 'trigger'],
	},
];

export const appMinimalPermissions: Partial<Permission>[] = [
	{
		collection: 'directus_activity',
		action: 'read',
		permissions: {
			user: {
				_eq: '$CURRENT_USER',
			},
		},
	},
	{
		collection: 'directus_activity',
		action: 'create',
		validation: {
			comment: {
				_nnull: true,
			},
		},
	},
	{
		collection: 'directus_collections',
		action: 'read',
	},
	{
		collection: 'directus_fields',
		action: 'read',
	},
	{
		collection: 'directus_permissions',
		action: 'read',
		permissions: {
			role: {
				_eq: '$CURRENT_ROLE',
			},
		},
	},
	{
		collection: 'directus_presets',
		action: 'read',
		permissions: {
			_or: [
				{
					user: {
						_eq: '$CURRENT_USER',
					},
				},
				{
					_and: [
						{
							user: {
								_null: true,
							},
						},
						{
							role: {
								_eq: '$CURRENT_ROLE',
							},
						},
					],
				},
				{
					_and: [
						{
							user: {
								_null: true,
							},
						},
						{
							role: {
								_null: true,
							},
						},
					],
				},
			],
		},
	},
	{
		collection: 'directus_presets',
		action: 'create',
		validation: {
			user: {
				_eq: '$CURRENT_USER',
			},
		},
	},
	{
		collection: 'directus_presets',
		action: 'update',
		permissions: {
			user: {
				_eq: '$CURRENT_USER',
			},
		},
	},
	{
		collection: 'directus_presets',
		action: 'delete',
		permissions: {
			user: {
				_eq: '$CURRENT_USER',
			},
		},
	},
	{
		collection: 'directus_relations',
		action: 'read',
	},
	{
		collection: 'directus_roles',
		action: 'read',
		permissions: {
			id: {
				_eq: '$CURRENT_ROLE',
			},
		},
	},
	{
		collection: 'directus_settings',
		action: 'read',
	},
	{
		collection: 'directus_translations',
		action: 'read',
	},
	{
		collection: 'directus_shares',
		action: 'read',
		permissions: {
			user_created: {
				_eq: '$CURRENT_USER',
			},
		},
	},
	{
		collection: 'directus_users',
		action: 'read',
		permissions: {
			id: {
				_eq: '$CURRENT_USER',
			},
		},
		fields: [
			'id',
			'first_name',
			'last_name',
			'last_page',
			'email',
			'password',
			'location',
			'title',
			'description',
			'tags',
			'preferences_divider',
			'avatar',
			'language',
			'theme',
			'tfa_secret',
			'status',
			'role',
		],
	},
];
