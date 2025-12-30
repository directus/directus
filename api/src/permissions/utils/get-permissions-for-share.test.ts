import type { Context } from '../types.js';
import { getPermissionsForShare } from './get-permissions-for-share.js';
import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import { beforeAll, describe, expect, test, vi } from 'vitest';

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
				fields: [],
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
				fields: [],
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
				fields: [],
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
				fields: [],
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
				fields: [],
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

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').integer().primary();
		c.field('title').string();
		c.field('authors').o2m('authors', 'article');
	})
	.collection('authors', (c) => {
		c.field('id').integer().primary();
		c.field('name').string();
	})
	.collection('super_secret_table', (c) => {
		c.field('id').integer().primary();
		c.field('secret').string();
	})
	.build();
