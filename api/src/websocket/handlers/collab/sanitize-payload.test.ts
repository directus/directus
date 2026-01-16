import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchPermissions } from '../../../permissions/lib/fetch-permissions.js';
import { ItemsService } from '../../../services/index.js';
import { sanitizePayload } from './sanitize-payload.js';

vi.mock('../../../permissions/lib/fetch-policies.js');
vi.mock('../../../permissions/lib/fetch-permissions.js');
vi.mock('../../../services/index.js');

vi.mock('../../../permissions/utils/fetch-dynamic-variable-data.js', () => ({
	fetchDynamicVariableData: vi.fn().mockResolvedValue({}),
}));

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('authors');
		c.field('secret').hash();
		c.field('tags').m2m('tags');
		c.field('comments').o2m('comments', 'article_id');
		c.field('a2o_items').m2a(['authors', 'a2o_collection']);
	})
	.collection('tags', (c) => {
		c.field('id').id();
		c.field('tag').string();
		c.field('secret').hash();
	})
	.collection('authors', (c) => {
		c.field('id').id();
		c.field('name').string();
		c.field('email').string();
		c.field('private_notes').string();
		c.field('profile').m2o('profiles');
	})
	.collection('comments', (c) => {
		c.field('id').id();
		c.field('text').string();
		c.field('status').string();
		c.field('internal_note').string();
		c.field('article_id').integer();
	})
	.collection('profiles', (c) => {
		c.field('id').id();
		c.field('bio').string();
		c.field('verified').boolean();
	})
	.collection('a2o_collection', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.build();

// Catch-all mock item used to satisfy existence checks for nested updates
const mockItem = new Proxy(
	{},
	{
		// Prevents the proxy from being mistaken for a Promise by await
		get: (_target, prop) => (prop === 'then' ? undefined : 'value'),
		has: (_target, _prop) => true,
		ownKeys: (_target) => [],
		getOwnPropertyDescriptor: (_target, _prop) => ({ configurable: true, enumerable: true, value: 'value' }),
	},
);

vi.mocked(ItemsService).mockImplementation(
	() =>
		({
			readOne: vi.fn().mockResolvedValue(mockItem),
		}) as any,
);

beforeEach(() => {
	vi.clearAllMocks();
});

const accountability = { user: 'test-user', roles: ['test-role'] } as Accountability;
const adminAccountability = { user: 'admin', roles: ['admin'], admin: true } as Accountability;

const db = vi.mocked(knex.default({ client: MockClient }));

describe('sanitizePayload', () => {
	describe('Basic Permissions', () => {
		test('returns empty object with no permissions', async () => {
			vi.mocked(fetchPermissions).mockResolvedValueOnce([]);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, title: 'Hello World', secret: 'top secret' },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({});
		});

		test('filters hash fields', async () => {
			vi.mocked(fetchPermissions).mockResolvedValueOnce([
				{
					action: 'read',
					collection: 'articles',
					fields: ['*'],
					policy: null,
					permissions: null,
					presets: [],
					validation: null,
				},
			]);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, title: 'Hello World', secret: 'top secret' },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({ id: 1, title: 'Hello World' });
		});

		test('filters fields based on permissions', async () => {
			vi.mocked(fetchPermissions).mockResolvedValueOnce([
				{
					action: 'read',
					collection: 'articles',
					fields: ['title'],
					policy: null,
					permissions: null,
					presets: [],
					validation: null,
				},
			]);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, title: 'Hello World', secret: 'top secret' },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({ title: 'Hello World' });
		});
	});

	describe('Admin Bypass', () => {
		test('admin bypasses permissions except for hash fields', async () => {
			vi.mocked(fetchPermissions).mockResolvedValueOnce([]);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, title: 'Hello World', secret: 'top secret' },
				{ schema, accountability: adminAccountability, knex: db },
			);

			expect(result).toEqual({ id: 1, title: 'Hello World' });
		});

		test('admin bypasses nested update existence checks', async () => {
			vi.mocked(fetchPermissions).mockResolvedValueOnce([]);

			vi.mocked(ItemsService).mockImplementationOnce(
				() =>
					({
						readOne: () => Promise.reject({ code: 'RECORD_NOT_FOUND', status: 404 }),
					}) as any,
			);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, author: { id: 99, name: 'New Author' } },
				{ schema, accountability: adminAccountability, knex: db },
			);

			expect(result).toEqual({ id: 1, author: { id: 99, name: 'New Author' } });
		});
	});

	describe('Relational Permissions', () => {
		describe('M2O', () => {
			test('filters fields on nested collection', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([
					{
						action: 'read',
						collection: 'articles',
						fields: ['*'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
					{
						action: 'read',
						collection: 'authors',
						fields: ['id', 'name'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
				]);

				const result = await sanitizePayload(
					'articles',
					{ id: 1, title: 'Hello World', author: { id: 10, name: 'John Doe', email: 'john@example.com' } },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({
					id: 1,
					title: 'Hello World',
					author: { id: 10, name: 'John Doe' },
				});
			});

			test('removes nested object if no collection access', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([
					{
						action: 'read',
						collection: 'articles',
						fields: ['*'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
				]);

				const result = await sanitizePayload(
					'articles',
					{ id: 1, title: 'Hello World', author: { id: 10, name: 'John Doe' } },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({ id: 1, title: 'Hello World' });
			});
		});

		describe('O2M', () => {
			test('filters fields on nested items', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([
					{
						action: 'read',
						collection: 'articles',
						fields: ['*'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
					{
						action: 'read',
						collection: 'comments',
						fields: ['id', 'text'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
				]);

				const result = await sanitizePayload(
					'articles',
					{ id: 1, title: 'Hello World', comments: [{ id: 1, text: 'text', internal_note: 'note' }] },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({
					id: 1,
					title: 'Hello World',
					comments: [{ id: 1, text: 'text' }],
				});
			});

			test('removes relation if all nested items are filtered in simple array', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([
					{
						action: 'read',
						collection: 'articles',
						fields: ['*'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
				]);

				const result = await sanitizePayload(
					'articles',
					{ id: 1, comments: [{ id: 1, text: 'text' }] },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({ id: 1 });
			});

			test('removes relation if all operations in detailed syntax are filtered', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([
					{
						action: 'read',
						collection: 'articles',
						fields: ['*'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
				]);

				const result = await sanitizePayload(
					'articles',
					{ id: 1, comments: { create: [{ id: 1, text: 'text' }], update: [], delete: [] } },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({ id: 1 });
			});

			test('filters empty objects from detailed update syntax', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([
					{
						action: 'read',
						collection: 'articles',
						fields: ['*'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
					{
						action: 'read',
						collection: 'comments',
						fields: ['id', 'text'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
				]);

				const result = await sanitizePayload(
					'articles',
					{ id: 1, comments: { create: [{}, { id: 1, text: 'Hello' }], update: [], delete: [] } },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({ id: 1, comments: { create: [{ id: 1, text: 'Hello' }], update: [], delete: [] } });
			});
		});

		describe('M2M', () => {
			test('removes relation if junction has no permissions', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([
					{
						action: 'read',
						collection: 'articles',
						fields: ['*'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
				]);

				const result = await sanitizePayload(
					'articles',
					{ id: 1, tags: [{ tag_id: 1 }] },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({ id: 1 });
			});

			test('filters nested collection fields via junction', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([
					{
						action: 'read',
						collection: 'articles',
						fields: ['*'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
					{
						action: 'read',
						collection: 'articles_tags_junction',
						fields: ['tags_id'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
					{
						action: 'read',
						collection: 'tags',
						fields: ['id', 'tag'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
				]);

				const result = await sanitizePayload(
					'articles',
					{ id: 1, tags: [{ articles_id: 1, tags_id: { id: 1, tag: 'news', secret: 'hide' } }] },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({
					id: 1,
					tags: [{ tags_id: { id: 1, tag: 'news' } }],
				});
			});

			test('handles detailed update syntax', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([
					{
						action: 'read',
						collection: 'articles',
						fields: ['*'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
					{
						action: 'read',
						collection: 'articles_tags_junction',
						fields: ['*'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
					{
						action: 'read',
						collection: 'tags',
						fields: ['tag'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
				]);

				const result = await sanitizePayload(
					'articles',
					{ id: 10, tags: { create: [{ tags_id: { id: 11, tag: 'news' } }], update: [], delete: [] } },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({
					id: 10,
					tags: { create: [{ tags_id: { tag: 'news' } }], update: [], delete: [] },
				});
			});
		});

		describe('A2O', () => {
			test('filters fields on multiple related collections', async () => {
				vi.mocked(fetchPermissions).mockResolvedValueOnce([
					{
						action: 'read',
						collection: 'articles',
						fields: ['id', 'a2o_items'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
					{
						action: 'read',
						collection: 'articles_builder',
						fields: ['*'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
					{
						action: 'read',
						collection: 'authors',
						fields: ['name'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
					{
						action: 'read',
						collection: 'a2o_collection',
						fields: ['id'],
						policy: null,
						permissions: null,
						presets: [],
						validation: null,
					},
				]);

				const result = await sanitizePayload(
					'articles',
					{
						id: 1,
						a2o_items: [
							{ collection: 'authors', item: { id: 10, name: 'John Doe', email: 'john@test.com' } },
							{ collection: 'a2o_collection', item: { id: 20, name: 'Sample Item' } },
						],
					},
					{ schema, accountability, knex: db },
					['id', 'a2o_items'],
				);

				expect(result).toEqual({
					id: 1,
					a2o_items: [
						{ collection: 'authors', item: { name: 'John Doe' } },
						{ collection: 'a2o_collection', item: { id: 20 } },
					],
				});
			});
		});
	});

	describe('Item-Level & Conditional Permissions', () => {
		test('removes nested items failing existence or permission check via DB', async () => {
			vi.mocked(fetchPermissions).mockResolvedValueOnce([
				{
					action: 'read',
					collection: 'articles',
					fields: ['*'],
					policy: null,
					permissions: null,
					presets: [],
					validation: null,
				},
				{
					action: 'read',
					collection: 'comments',
					fields: ['id', 'text'],
					policy: null,
					permissions: { id: { _neq: 999 } },
					presets: [],
					validation: null,
				},
			]);

			const readOneMock = vi.fn().mockImplementation(async (key) => {
				if (key === 999) throw new Error('Forbidden');
				return { id: key, text: 'Allowed comment' };
			});

			vi.mocked(ItemsService).mockReturnValue({ readOne: readOneMock } as any);

			const result = await sanitizePayload(
				'articles',
				{
					id: 1,
					comments: {
						create: [],
						update: [
							{ id: 2, text: 'Allowed' },
							{ id: 999, text: 'Hidden' },
						],
						delete: [],
					},
				},
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({
				id: 1,
				comments: { create: [], update: [{ id: 2, text: 'Allowed' }], delete: [] },
			});
		});

		test('filters new items failing conditional permission rules', async () => {
			vi.mocked(fetchPermissions).mockResolvedValueOnce([
				{
					action: 'read',
					collection: 'articles',
					fields: ['*'],
					policy: null,
					permissions: null,
					presets: [],
					validation: null,
				},
				{
					action: 'read',
					collection: 'comments',
					fields: ['*'],
					policy: null,
					permissions: { status: { _eq: 'published' } },
					presets: [],
					validation: null,
				},
			]);

			const result = await sanitizePayload(
				'articles',
				{
					id: 1,
					comments: {
						create: [
							{ status: 'published', text: 'Ok' },
							{ status: 'draft', text: 'No' },
						],
						update: [],
						delete: [],
					},
				},
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({
				id: 1,
				comments: { create: [{ status: 'published', text: 'Ok' }], update: [], delete: [] },
			});
		});
	});

	describe('Complex Scenarios', () => {
		test('processes dynamic variables ($CURRENT_USER) in nested permissions', async () => {
			vi.mocked(fetchPermissions).mockResolvedValueOnce([
				{
					action: 'read',
					collection: 'articles',
					fields: ['*'],
					policy: null,
					permissions: null,
					presets: [],
					validation: null,
				},
				{
					action: 'read',
					collection: 'authors',
					fields: ['id', 'name'],
					policy: null,
					permissions: { id: { _eq: '$CURRENT_USER' } },
					presets: [],
					validation: null,
				},
			]);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, author: { id: 'test-user', name: 'My Author' } },
				{ schema, accountability, knex: db },
				['id', 'author'],
			);

			expect(result).toEqual({
				id: 1,
				author: { id: 'test-user', name: 'My Author' },
			});
		});

		test('handles deep recursion across multiple levels (3+)', async () => {
			vi.mocked(fetchPermissions).mockResolvedValueOnce([
				{
					action: 'read',
					collection: 'articles',
					fields: ['*'],
					policy: null,
					permissions: null,
					presets: [],
					validation: null,
				},
				{
					action: 'read',
					collection: 'authors',
					fields: ['id', 'name', 'profile'],
					policy: null,
					permissions: null,
					presets: [],
					validation: null,
				},
				{
					action: 'read',
					collection: 'profiles',
					fields: ['id', 'bio'],
					policy: null,
					permissions: null,
					presets: [],
					validation: null,
				},
			]);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, author: { id: 10, name: 'Author', profile: { id: 100, bio: 'Bio', verified: true } } },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({
				id: 1,
				author: { id: 10, name: 'Author', profile: { id: 100, bio: 'Bio' } },
			});
		});
	});
});
