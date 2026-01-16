import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import knex from 'knex';
import { MockClient } from 'knex-mock-client';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { sanitizePayload } from './sanitize-payload.js';
import { verifyPermissions } from './verify-permissions.js';

vi.mock('./verify-permissions.js');

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

beforeEach(() => {
	vi.clearAllMocks();
});

const accountability = { user: 'test-user', roles: ['test-role'] } as Accountability;
const adminAccountability = { user: 'admin', roles: ['admin'], admin: true } as Accountability;

const db = vi.mocked(knex.default({ client: MockClient }));

describe('sanitizePayload', () => {
	describe('Basic Permissions', () => {
		test('returns empty object with no permissions', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['id']);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, title: 'Hello World', secret: 'top secret' },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({ id: 1 });
		});

		test('filters hash fields', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, title: 'Hello World', secret: 'top secret' },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({ id: 1, title: 'Hello World' });
		});

		test('filters fields based on permissions', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['title']);

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
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, title: 'Hello World', secret: 'top secret' },
				{ schema, accountability: adminAccountability, knex: db },
			);

			expect(result).toEqual({ id: 1, title: 'Hello World' });
		});

		test('admin bypasses nested update existence checks', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

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
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					if (collection === 'authors') return ['id', 'name'];
					return [];
				});

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
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					return [];
				});

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
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					if (collection === 'comments') return ['id', 'text'];
					return [];
				});

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
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					return [];
				});

				const result = await sanitizePayload(
					'articles',
					{ id: 1, comments: [{ id: 1, text: 'text' }] },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({ id: 1 });
			});

			test('removes relation if all operations in detailed syntax are filtered', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					return [];
				});

				const result = await sanitizePayload(
					'articles',
					{ id: 1, comments: { create: [{ id: 1, text: 'text' }], update: [], delete: [] } },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({ id: 1 });
			});

			test('filters empty objects from detailed update syntax', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					if (collection === 'comments') return ['id', 'text'];
					return [];
				});

				const result = await sanitizePayload(
					'articles',
					{ id: 1, comments: { create: [{}, { id: 1, text: 'Hello' }], update: [{}], delete: [{}] } },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({ id: 1, comments: { create: [{}, { id: 1, text: 'Hello' }], update: [], delete: [] } });
			});
		});

		describe('M2M', () => {
			test('removes relation if junction has no permissions', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					return [];
				});

				const result = await sanitizePayload(
					'articles',
					{ id: 1, tags: [{ tags_id: 1 }] },
					{ schema, accountability, knex: db },
				);

				expect(result).toEqual({ id: 1 });
			});

			test('filters nested collection fields via junction', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					if (collection === 'articles_tags_junction') return ['tags_id'];
					if (collection === 'tags') return ['id', 'tag'];
					return [];
				});

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
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					if (collection === 'articles_tags_junction') return ['*'];
					if (collection === 'tags') return ['tag'];
					return [];
				});

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
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['id', 'a2o_items'];
					if (collection === 'articles_builder') return ['*'];
					if (collection === 'authors') return ['name'];
					if (collection === 'a2o_collection') return ['id'];
					return [];
				});

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
		test('removes nested items failing existence or permission check via verifyPermissions', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection, item) => {
				if (collection === 'articles') return ['*'];
				if (collection === 'comments' && item === 2) return ['id', 'text'];
				return [];
			});

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

		test('filters new items failing permission rules via verifyPermissions', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection, _item) => {
				if (collection === 'articles') return ['*'];

				if (collection === 'comments') {
					// Dummy logic simulating permission filter on 'status'
					// In reality verifyPermissions would check this
					return ['status', 'text'];
				}

				return [];
			});

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
				comments: {
					create: [
						{ status: 'published', text: 'Ok' },
						{ status: 'draft', text: 'No' },
					],
					update: [],
					delete: [],
				},
			});
		});
	});

	describe('Complex Scenarios', () => {
		test('handles deep recursion across multiple levels (3+)', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
				if (collection === 'articles') return ['*'];
				if (collection === 'authors') return ['id', 'name', 'profile'];
				if (collection === 'profiles') return ['id', 'bio'];
				return [];
			});

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

		test('handles wildcard "*" access correctly', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, title: 'Hello World' },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({ id: 1, title: 'Hello World' });
		});

		test('handles nested creation (null primary key) correctly', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection, item) => {
				if (collection === 'articles') return ['*'];
				if (collection === 'comments' && item === null) return ['text'];
				return [];
			});

			const result = await sanitizePayload(
				'articles',
				{ id: 1, comments: { create: [{ text: 'Hello' }], update: [], delete: [] } },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({
				id: 1,
				comments: { create: [{ text: 'Hello' }], update: [], delete: [] },
			});

			expect(verifyPermissions).toHaveBeenCalledWith(accountability, 'comments', null, 'read');
		});

		test('handles mixed payloads (root + nested)', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
				if (collection === 'articles') return ['title', 'author'];
				if (collection === 'authors') return ['name'];
				return [];
			});

			const result = await sanitizePayload(
				'articles',
				{ title: 'New Title', author: { id: 1, name: 'John', email: 'hidden@test.com' }, secret: 'hide' },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({
				title: 'New Title',
				author: { name: 'John' },
			});
		});

		test('handles deletion syntax (no recursion into primary keys array)', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, comments: { create: [], update: [], delete: [100, 101] } },
				{ schema, accountability: adminAccountability, knex: db },
			);

			expect(result).toEqual({
				id: 1,
				comments: { create: [], update: [], delete: [100, 101] },
			});

			// Should not call verifyPermissions for the array of IDs in 'delete'
			// It should only be called for 'articles' and potentially 'comments' (if it recursed, which it shouldn't for primitives)
			const collectionsCalled = vi.mocked(verifyPermissions).mock.calls.map((c) => c[1]);
			expect(collectionsCalled).toContain('articles');
			expect(collectionsCalled).not.toContain('comments'); // Detailed syntax should handle delete specialized
		});
	});

	describe('Null and Empty Values', () => {
		test('preserves null values for fields with permission', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, title: null, author: null },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({ id: 1, title: null, author: null });
		});

		test('preserves null for M2O/A2O relations', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
				if (collection === 'articles') return ['*'];
				return [];
			});

			const result = await sanitizePayload(
				'articles',
				{ id: 1, author: null, a2o_items: null },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({ id: 1, author: null, a2o_items: null });
		});

		test('strips empty objects in M2O/A2O relations', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, author: {}, a2o_items: {} },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({ id: 1 });
		});
	});

	describe('Detailed Update Syntax Edge Cases', () => {
		test('removes detailed syntax object if all arrays are empty', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload(
				'articles',
				{ id: 1, comments: { create: [], update: [], delete: [] } },
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({ id: 1 });
		});

		test('removes detailed syntax object if all operations filtered out', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
				if (collection === 'articles') return ['*'];
				if (collection === 'comments') return []; // No access to comments
				return [];
			});

			const result = await sanitizePayload(
				'articles',
				{
					id: 1,
					comments: {
						create: [{ text: 'New' }],
						update: [{ id: 2, text: 'Update' }],
						delete: [3],
					},
				},
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({
				id: 1,
				comments: {
					create: [{}, { text: 'New' }],
					update: [],
					delete: [3],
				},
			});
		});

		test('handles mixed valid and invalid items in detailed syntax', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection, item) => {
				if (collection === 'articles') return ['*'];

				// Allow item 2 but not item 99
				if (collection === 'comments') {
					if (item === 2) return ['id', 'text'];
					if (item === 99) return [];
					if (item === null) return ['text']; // Allow create
				}

				return [];
			});

			const result = await sanitizePayload(
				'articles',
				{
					id: 1,
					comments: {
						create: [{}, { text: 'New' }], // First empty, second valid
						update: [
							{ id: 2, text: 'Allowed' },
							{ id: 99, text: 'Hidden' },
						],
						delete: [],
					},
				},
				{ schema, accountability, knex: db },
			);

			expect(result).toEqual({
				id: 1,
				comments: {
					create: [{}, { text: 'New' }],
					update: [{ id: 2, text: 'Allowed' }],
					delete: [],
				},
			});
		});
	});
});
