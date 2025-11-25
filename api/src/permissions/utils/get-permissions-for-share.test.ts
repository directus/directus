import { beforeAll, describe, expect, test, vi } from 'vitest';
import { getPermissionsForShare } from './get-permissions-for-share.js';
import type { Accountability } from '@directus/types';
import type { Context } from '../types.js';
import { SchemaBuilder } from '@directus/schema-builder';

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
		} else if (id === '6') {
			return {
				collection: 'articles',
				item: 'item-id',
				role: 'user',
				user_created: {
					id: 'user',
					role: 'user',
				},
			};
		} else if (id === '7') {
			return {
				collection: 'articles',
				item: 'item-id',
				role: 'user',
				user_created: null,
			};
		} else if (id === '8') {
			return {
				collection: 'articles',
				item: 'item-id',
				role: 'admin',
				user_created: null,
			};
		} else if (id === '9') {
			// share role is admin, but user is not admin
			return {
				collection: 'articles',
				item: 'item-id',
				role: 'admin',
				user_created: {
					id: 'user',
					role: 'user',
				},
			};
		} else if (id === '10') {
			// share role is user, but user is admin
			return {
				collection: 'articles',
				item: 'item-id',
				role: 'user',
				user_created: {
					id: 'admin',
					role: 'admin',
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
						{
							'$FOLLOW(authors,article)': {
								article: {
									id: {
										_eq: 'item-id',
									},
								},
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
					_or: [
						{
							article: {
								_eq: 'item-id',
							},
						},
						{
							article: {
								_eq: 'item-id',
							},
						},
					],
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

	test('no role selected and created by system', async () => {
		const accountability: Accountability = {
			user: 'user',
			role: 'user',
			admin: false,
			app: false,
			ip: '',
			roles: [],
			share: '7',
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

	test('admin role selected and created by system', async () => {
		const accountability: Accountability = {
			user: 'admin',
			role: 'admin',
			admin: false,
			app: false,
			ip: '',
			roles: [],
			share: '8',
		};

		const permissions = await getPermissionsForShare(accountability, undefined, context);

		const articlePerm = permissions.find((p) => p.collection === 'articles');

		expect(articlePerm).toMatchObject({
			action: 'read',
			collection: 'articles',
			fields: [],
		});

		expect(permissions).toContainEqual(
			expect.objectContaining({
				collection: 'directus_collections',
				system: true,
			}),
		);
	});

	describe('collections parameter filtering', () => {
		test('filters permissions to only specified collections', async () => {
			const accountability: Accountability = {
				user: 'admin',
				role: 'admin',
				admin: false,
				app: false,
				ip: '',
				roles: [],
				share: '4',
			};

			const permissions = await getPermissionsForShare(accountability, ['articles'], context);

			expect(permissions).toHaveLength(1);

			expect(permissions[0]).toMatchObject({
				collection: 'articles',
				action: 'read',
				fields: ['*'],
			});
		});

		test('filters permissions to multiple specified collections', async () => {
			const accountability: Accountability = {
				user: 'admin',
				role: 'admin',
				admin: false,
				app: false,
				ip: '',
				roles: [],
				share: '4',
			};

			const permissions = await getPermissionsForShare(accountability, ['articles', 'authors'], context);

			const collections = permissions.map((p) => p.collection);

			expect(collections).toEqual(expect.arrayContaining(['articles', 'authors']));
			expect(collections).not.toContain('directus_collections');
		});

		test('returns empty array when no collections match filter', async () => {
			const accountability: Accountability = {
				user: 'admin',
				role: 'admin',
				admin: false,
				app: false,
				ip: '',
				roles: [],
				share: '8',
			};

			const permissions = await getPermissionsForShare(accountability, ['non_existent_collection'], context);

			expect(permissions).toEqual([]);
		});
	});

	describe('relational permissions', () => {
		test('includes m2o relations', async () => {
			const extendedContext: Context = {
				schema: extendedSchema,
				knex: null as any,
			};

			const accountability: Accountability = {
				user: 'admin',
				role: 'admin',
				admin: false,
				app: false,
				ip: '',
				roles: [],
				share: '4',
			};

			const permissions = await getPermissionsForShare(accountability, undefined, extendedContext);

			const categoryPermissions = permissions.filter((p) => p.collection === 'categories');
			expect(categoryPermissions.length).toBeGreaterThan(0);

			const hasM2oFollow = categoryPermissions.some((p) => {
				const permsStr = JSON.stringify(p.permissions);
				return permsStr.includes('$FOLLOW(articles,category)');
			});

			expect(hasM2oFollow).toBe(true);
		});

		test('handles circular relationships without infinite loop', async () => {
			const accountability: Accountability = {
				user: 'admin',
				role: 'admin',
				admin: false,
				app: false,
				ip: '',
				roles: [],
				share: '8',
			};

			const permissions = await getPermissionsForShare(accountability, undefined, context);

			expect(permissions).toBeDefined();
			expect(permissions.length).toBeGreaterThan(0);
		});
	});

	describe('mixed admin scenarios', () => {
		test('share role is admin but user is not admin - uses share permissions', async () => {
			const accountability: Accountability = {
				user: 'user',
				role: 'user',
				admin: false,
				app: false,
				ip: '',
				roles: [],
				share: '9',
			};

			const permissions = await getPermissionsForShare(accountability, undefined, context);

			const articlePermission = permissions.find((p) => p.collection === 'articles');

			expect(articlePermission).toMatchObject({
				collection: 'articles',
				action: 'read',
				fields: [],
			});
		});

		test('share role is not admin but user is admin - uses user permissions', async () => {
			const accountability: Accountability = {
				user: 'admin',
				role: 'admin',
				admin: false,
				app: false,
				ip: '',
				roles: [],
				share: '10',
			};

			const permissions = await getPermissionsForShare(accountability, undefined, context);

			const articlePermission = permissions.find((p) => p.collection === 'articles');

			expect(articlePermission).toMatchObject({
				collection: 'articles',
				action: 'read',
				fields: [],
			});
		});
	});

	describe('permission intersection logic', () => {
		test('non-admin user and non-admin share result in intersection of permissions', async () => {
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

			const articlePermission = permissions.find((p) => p.collection === 'articles');

			expect(articlePermission).toMatchObject({
				collection: 'articles',
				action: 'read',
				permissions: expect.objectContaining({
					id: expect.any(Object),
				}),
			});
		});
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
		c.field('article').m2o('articles', 'authors');
	})
	.collection('super_secret_table', (c) => {
		c.field('id').integer().primary();
		c.field('secret').string();
	})
	.build();

const extendedSchema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').integer().primary();
		c.field('title').string();
		c.field('authors').o2m('authors', 'article');
		c.field('category').m2o('categories', 'articles');
	})
	.collection('authors', (c) => {
		c.field('id').integer().primary();
		c.field('name').string();
		c.field('article').m2o('articles', 'authors');
	})
	.collection('categories', (c) => {
		c.field('id').integer().primary();
		c.field('name').string();
		c.field('articles').o2m('articles', 'category');
	})
	.collection('super_secret_table', (c) => {
		c.field('id').integer().primary();
		c.field('secret').string();
	})
	.build();
