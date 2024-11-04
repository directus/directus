import { beforeAll, describe, expect, test, vi } from 'vitest';
import { getPermissionsForShare } from './get-permissions-for-share.js';
import type { Accountability, SchemaOverview } from '@directus/types';
import type { Context } from '../types.js';

vi.mock('../modules/fetch-global-access/fetch-global-access.js', () => ({
	fetchGlobalAccess: vi.fn().mockImplementation((accountability: Accountability) => {
		return {
			admin: accountability.user === 'admin' || accountability.role === 'admin',
		};
	}),
}));

vi.mock('../lib/fetch-roles-tree.js', () => ({
	fetchRolesTree: vi.fn().mockImplementation((start: string | null) => {
		return [start!];
	}),
}));

vi.mock('../lib/fetch-policies.js', () => ({
	fetchPolicies: vi.fn().mockImplementation(() => {
		return [];
	}),
}));

vi.mock('../lib/fetch-permissions.js', () => ({
	fetchPermissions: vi.fn().mockImplementation(({ accountability }: { policy: any; accountability: any }) => {
		if (accountability.user === 'admin' || accountability.role === 'admin') {
			return [];
		} else if (accountability.role === 'manager') {
			return [];
		} else {
			return [];
		}
	}),
}));

vi.mock('./fetch-share-info.js', () => ({
	fetchShareInfo: vi.fn().mockImplementation((id: string) => {
		if (id === '1') {
			return {
				collection: 'articles',
				item: 'item-id',
				role: null,
				user_created: {
					id: 'admin',
					role: 'admin',
				},
			};
		} else if (id === '2') {
			return {
				collection: 'articles',
				item: 'item-id',
				role: null,
				user_created: {
					id: 'manager',
					role: 'manager',
				},
			};
		} else if (id === '3') {
			return {
				collection: 'articles',
				item: 'item-id',
				role: null,
				user_created: {
					id: 'user',
					role: 'user',
				},
			};
		} else if (id === '4') {
			return {
				collection: 'articles',
				item: 'item-id',
				role: 'admin',
				user_created: {
					id: 'admin',
					role: 'admin',
				},
			};
		} else if (id === '5') {
			return {
				collection: 'articles',
				item: 'item-id',
				role: 'manager',
				user_created: {
					id: 'manager',
					role: 'manager',
				},
			};
		} else {
			return {
				collection: 'articles',
				item: 'item-id',
				role: 'user',
				user_created: {
					id: 'user',
					role: 'user',
				},
			};
		}
	}),
}));

vi.mock('../modules/fetch-allowed-field-map/fetch-allowed-field-map.js', () => ({
	fetchAllowedFieldMap: vi.fn().mockImplementation((accountability) => {
		if (accountability.user === 'admin' || accountability.role === 'admin') {
			return {
				articles: ['id', 'title', 'authors'],
				authors: ['id', 'name', 'article'],
				super_secret_table: ['id', 'secret'],
			};
		} else if (accountability.role === 'manager') {
			return { articles: ['id', 'title'] };
		} else {
			return {};
		}
	}),
}));

describe('getPermissionsForShare', () => {
	let context: Context;

	beforeAll(() => {
		context = {
			schema,
			knex: null as any,
		};
	});

	test('no role selected and created by admin user', async () => {
		const accountability: Accountability = {
			user: 'admin',
			role: 'admin',
			admin: false,
			app: false,
			ip: '',
			roles: [],
			share: '1',
		};

		const permissions = await getPermissionsForShare(accountability, undefined, context);

		expect(permissions).toEqual([
			{
				action: 'read',
				collection: 'articles',
				fields: null,
				permissions: {
					id: {
						_eq: 'item-id',
					},
				},
				policy: null,
				presets: null,
				validation: null,
			},
			...basePermissions,
		]);
	});

	test('no role selected and created by manager', async () => {
		const accountability: Accountability = {
			user: 'manager',
			role: 'manager',
			admin: false,
			app: false,
			ip: '',
			roles: [],
			share: '2',
		};

		const permissions = await getPermissionsForShare(accountability, undefined, context);

		expect(permissions).toEqual([
			{
				action: 'read',
				collection: 'articles',
				fields: null,
				permissions: {
					id: {
						_eq: 'item-id',
					},
				},
				policy: null,
				presets: null,
				validation: null,
			},
			...basePermissions,
		]);
	});

	test('no role selected and created by user', async () => {
		const accountability: Accountability = {
			user: 'user',
			role: 'user',
			admin: false,
			app: false,
			ip: '',
			roles: [],
			share: '3',
		};

		const permissions = await getPermissionsForShare(accountability, undefined, context);

		expect(permissions).toEqual([
			{
				action: 'read',
				collection: 'articles',
				fields: null,
				permissions: {
					id: {
						_eq: 'item-id',
					},
				},
				policy: null,
				presets: null,
				validation: null,
			},
			...basePermissions,
		]);
	});

	test('admin role selected and created by admin', async () => {
		const accountability: Accountability = {
			user: 'admin',
			role: 'admin',
			admin: false,
			app: false,
			ip: '',
			roles: [],
			share: '4',
		};

		const permissions = await getPermissionsForShare(accountability, undefined, context);

		expect(permissions).toEqual([
			{
				action: 'read',
				collection: 'articles',
				fields: ['*'],
				permissions: {
					_or: [
						{
							id: {
								_eq: 'item-id',
							},
						},
						{
							'$FOLLOW(authors,article)': {
								article: {
									id: {
										_eq: 'item-id',
									},
								},
							},
						},
					],
				},
				policy: null,
				presets: null,
				validation: null,
			},
			{
				action: 'read',
				collection: 'authors',
				fields: ['*'],
				permissions: {
					article: {
						_eq: 'item-id',
					},
				},
				policy: null,
				presets: null,
				validation: null,
			},
			...basePermissions,
		]);
	});

	test('admin role selected and created by manager', async () => {
		const accountability: Accountability = {
			user: 'manager',
			role: 'manager',
			admin: false,
			app: false,
			ip: '',
			roles: [],
			share: '5',
		};

		const permissions = await getPermissionsForShare(accountability, undefined, context);

		expect(permissions).toEqual([
			{
				action: 'read',
				collection: 'articles',
				fields: null,
				permissions: {
					id: {
						_eq: 'item-id',
					},
				},
				policy: null,
				presets: null,
				validation: null,
			},
			...basePermissions,
		]);
	});

	test('admin role selected and created by user', async () => {
		const accountability: Accountability = {
			user: 'user',
			role: 'user',
			admin: false,
			app: false,
			ip: '',
			roles: [],
			share: '6',
		};

		const permissions = await getPermissionsForShare(accountability, undefined, context);

		expect(permissions).toEqual([
			{
				action: 'read',
				collection: 'articles',
				fields: null,
				permissions: {
					id: {
						_eq: 'item-id',
					},
				},
				policy: null,
				presets: null,
				validation: null,
			},
			...basePermissions,
		]);
	});
});

const basePermissions = [
	{
		action: 'read',
		collection: 'directus_collections',
		fields: ['*'],
		permissions: {},
		policy: null,
		presets: null,
		system: true,
		validation: null,
	},
	{
		action: 'read',
		collection: 'directus_fields',
		fields: ['*'],
		permissions: {},
		policy: null,
		presets: null,
		system: true,
		validation: null,
	},
	{
		action: 'read',
		collection: 'directus_relations',
		fields: ['*'],
		permissions: {},
		policy: null,
		presets: null,
		system: true,
		validation: null,
	},
	{
		action: 'read',
		collection: 'directus_translations',
		fields: ['*'],
		permissions: {},
		policy: null,
		presets: null,
		system: true,
		validation: null,
	},
];

const schema: SchemaOverview = {
	collections: {
		articles: {
			collection: 'articles',
			accountability: 'all',
			note: '',
			primary: 'id',
			singleton: false,
			sortField: null,
			fields: {
				id: {
					field: 'id',
					type: 'integer',
					dbType: 'integer',
					nullable: false,
					generated: true,
					precision: null,
					scale: null,
					special: [],
					note: '',
					alias: false,
					validation: null,
					defaultValue: 'AUTO_INCREMENT',
				},
				title: {
					field: 'title',
					type: 'string',
					dbType: 'varchar',
					nullable: false,
					generated: false,
					precision: null,
					scale: null,
					special: [],
					note: '',
					alias: false,
					validation: null,
					defaultValue: null,
				},
				authors: {
					field: 'authors',
					defaultValue: null,
					nullable: true,
					generated: false,
					type: 'alias',
					dbType: null,
					precision: null,
					scale: null,
					special: ['o2m'],
					note: null,
					alias: true,
					validation: null,
				},
			},
		},
		authors: {
			collection: 'authors',
			accountability: 'all',
			note: '',
			primary: 'id',
			singleton: false,
			sortField: null,
			fields: {
				id: {
					field: 'id',
					type: 'integer',
					dbType: 'integer',
					nullable: false,
					generated: true,
					precision: null,
					scale: null,
					special: [],
					note: '',
					alias: false,
					validation: null,
					defaultValue: 'AUTO_INCREMENT',
				},
				name: {
					field: 'name',
					type: 'string',
					dbType: 'varchar',
					nullable: false,
					generated: false,
					precision: null,
					scale: null,
					special: [],
					note: '',
					alias: false,
					validation: null,
					defaultValue: null,
				},
				article: {
					field: 'article',
					defaultValue: null,
					nullable: true,
					generated: false,
					type: 'integer',
					dbType: 'integer',
					precision: null,
					scale: null,
					special: [],
					note: null,
					alias: false,
					validation: null,
				},
			},
		},
		super_secret_table: {
			collection: 'super_secret_table',
			accountability: 'all',
			note: '',
			primary: 'id',
			singleton: false,
			sortField: null,
			fields: {
				id: {
					field: 'id',
					type: 'integer',
					dbType: 'integer',
					nullable: false,
					generated: true,
					precision: null,
					scale: null,
					special: [],
					note: '',
					alias: false,
					validation: null,
					defaultValue: 'AUTO_INCREMENT',
				},
				secret: {
					field: 'secret',
					type: 'string',
					dbType: 'varchar',
					nullable: false,
					generated: false,
					precision: null,
					scale: null,
					special: [],
					note: '',
					alias: false,
					validation: null,
					defaultValue: null,
				},
			},
		},
	},
	relations: [
		{
			collection: 'authors',
			field: 'article',
			related_collection: 'articles',
			schema: {
				table: 'authors',
				column: 'article',
				foreign_key_table: 'articles',
				foreign_key_column: 'id',
				on_update: 'NO ACTION',
				on_delete: 'SET NULL',
				constraint_name: null,
			},
			meta: {
				id: 1,
				many_collection: 'authors',
				many_field: 'article',
				one_collection: 'articles',
				one_field: 'authors',
				one_collection_field: null,
				one_allowed_collections: null,
				junction_field: null,
				sort_field: null,
				one_deselect_action: 'nullify',
			},
		},
	],
};
