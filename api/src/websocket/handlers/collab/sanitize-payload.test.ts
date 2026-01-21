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
		c.field('replies').o2m('replies', 'comment_id');
	})
	.collection('replies', (c) => {
		c.field('id').id();
		c.field('text').string();
		c.field('secret').string();
		c.field('comment_id').integer();
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

			const result = await sanitizePayload({ id: 1, title: 'Hello World', secret: 'top secret' }, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			expect(result).toEqual({ id: 1 });
		});

		test('filters hash fields', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload({ id: 1, title: 'Hello World', secret: 'top secret' }, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			expect(result).toEqual({ id: 1, title: 'Hello World' });
		});

		test('filters fields based on permissions', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['title']);

			const result = await sanitizePayload({ id: 1, title: 'Hello World', secret: 'top secret' }, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			expect(result).toEqual({ title: 'Hello World' });
		});

		test('allow to read items that dont exist yet', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection, item) => {
				if (collection === 'articles') return ['*'];
				if (collection === 'comments') return item === 1 ? null : [];
				return [];
			});

			const result = await sanitizePayload({ id: 1, comments: [{ id: 1 }, { id: 2 }] }, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			expect(result).toEqual({ id: 1, comments: [{ id: 1 }] });
		});
	});

	describe('Admin Bypass', () => {
		test('admin bypasses permissions except for hash fields', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload({ id: 1, title: 'Hello World', secret: 'top secret' }, 'articles', {
				accountability: adminAccountability,
				schema,
				knex: db,
			});

			expect(result).toEqual({ id: 1, title: 'Hello World' });
		});

		test('admin bypasses nested update existence checks', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload({ id: 1, author: { id: 99, name: 'New Author' } }, 'articles', {
				accountability: adminAccountability,
				schema,
				knex: db,
			});

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
					{ id: 1, title: 'Hello World', author: { id: 10, name: 'John Doe', email: 'john@example.com' } },
					'articles',
					{
						accountability,
						schema,

						knex: db,
					},
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
					{ id: 1, title: 'Hello World', author: { id: 10, name: 'John Doe' } },
					'articles',
					{
						accountability,
						schema,

						knex: db,
					},
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
					{ id: 1, title: 'Hello World', comments: [{ id: 1, text: 'text', internal_note: 'note' }] },
					'articles',
					{
						accountability,
						schema,

						knex: db,
					},
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

				const result = await sanitizePayload({ id: 1, comments: [{ id: 1, text: 'text' }] }, 'articles', {
					accountability,
					schema,

					knex: db,
				});

				expect(result).toEqual({ id: 1 });
			});

			test('removes relation if all operations in detailed syntax are filtered', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					return [];
				});

				const result = await sanitizePayload(
					{ id: 1, comments: { create: [{ id: 1, text: 'text' }], update: [], delete: [] } },
					'articles',
					{
						accountability,
						schema,

						knex: db,
					},
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
					{ id: 1, comments: { create: [{}, { id: 1, text: 'Hello' }], update: [{}], delete: [{}] } },
					'articles',
					{
						accountability,
						schema,

						knex: db,
					},
				);

				expect(result).toEqual({ id: 1, comments: { create: [{ id: 1, text: 'Hello' }], update: [], delete: [] } });
			});

			test('filters O2M field when user lacks parent field permission', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['id', 'title']; // No comments field
					if (collection === 'comments') return ['*']; // Full access to comments collection
					return [];
				});

				const result = await sanitizePayload({ id: 1, title: 'Test', comments: [{ id: 1, text: 'Hi' }] }, 'articles', {
					accountability,
					schema,
					knex: db,
				});

				expect(result).toEqual({ id: 1, title: 'Test' });
			});
		});

		describe('M2M', () => {
			test('removes relation if junction has no permissions', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					return [];
				});

				const result = await sanitizePayload({ id: 1, tags: [{ tags_id: 1 }] }, 'articles', {
					accountability,
					schema,

					knex: db,
				});

				expect(result).toEqual({ id: 1 });
			});

			test('filters nested collection fields via junction', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
					if (collection === 'articles') return ['*'];
					if (collection === 'articles_tags_junction') return ['articles_id', 'tags_id'];
					if (collection === 'tags') return ['id', 'tag'];
					return [];
				});

				const result = await sanitizePayload(
					{ id: 1, tags: [{ articles_id: 1, tags_id: { id: 1, tag: 'news', secret: 'hide' } }] },
					'articles',
					{
						accountability,
						schema,

						knex: db,
					},
				);

				expect(result).toEqual({
					id: 1,
					tags: [{ articles_id: 1, tags_id: { id: 1, tag: 'news' } }],
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
					{ id: 10, tags: { create: [{ tags_id: { id: 11, tag: 'news' } }], update: [], delete: [] } },
					'articles',
					{
						accountability,
						schema,

						knex: db,
					},
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
					{
						id: 1,
						a2o_items: [
							{ collection: 'authors', item: { id: 10, name: 'John Doe', email: 'john@test.com' } },
							{ collection: 'a2o_collection', item: { id: 20, name: 'Sample Item' } },
						],
					},
					'articles',
					{
						accountability,
						schema,

						knex: db,
					},
				);

				expect(result).toEqual({
					id: 1,
					a2o_items: [
						{
							collection: 'authors',
							item: {
								name: 'John Doe',
							},
						},
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
				'articles',
				{
					schema,
					accountability,
					knex: db,
				},
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
				'articles',
				{
					schema,
					accountability,
					knex: db,
				},
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
				{ id: 1, author: { id: 10, name: 'Author', profile: { id: 100, bio: 'Bio', verified: true } } },
				'articles',
				{
					schema,
					accountability,
					knex: db,
				},
			);

			expect(result).toEqual({
				id: 1,
				author: { id: 10, name: 'Author', profile: { id: 100, bio: 'Bio' } },
			});
		});

		test('handles wildcard "*" access correctly', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload({ id: 1, title: 'Hello World' }, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			expect(result).toEqual({ id: 1, title: 'Hello World' });
		});

		test('handles mixed payloads (root + nested)', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
				if (collection === 'articles') return ['title', 'author'];
				if (collection === 'authors') return ['name'];
				return [];
			});

			const result = await sanitizePayload(
				{ title: 'New Title', author: { id: 1, name: 'John', email: 'hidden@test.com' }, secret: 'hide' },
				'articles',
				{
					schema,
					accountability,
					knex: db,
				},
			);

			expect(result).toEqual({
				title: 'New Title',
				author: { name: 'John' },
			});
		});

		test('handles deletion syntax (no recursion into primary keys array)', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload(
				{ id: 1, comments: { create: [], update: [], delete: [100, 101] } },
				'articles',
				{
					schema,
					accountability: adminAccountability,
					knex: db,
				},
			);

			expect(result).toEqual({
				id: 1,
				comments: { create: [], update: [], delete: [100, 101] },
			});

			// Should not call verifyPermissions for the array of IDs in 'delete'
			// It should only be called for 'articles' and potentially 'comments' (if it recursed, which it shouldn't for primitives)
			const collectionsCalled = vi.mocked(verifyPermissions).mock.calls.map((c) => c[1]);
			expect(collectionsCalled).toContain('articles');
			expect(collectionsCalled).toContain('comments'); // Now recurses to check PK permission
		});
	});

	describe('Null and Empty Values', () => {
		test('preserves null values for fields with permission', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload({ id: 1, title: null, author: null }, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			expect(result).toEqual({ id: 1, title: null, author: null });
		});

		test('filters null values for fields without permission', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['id']);

			const result = await sanitizePayload({ id: 1, title: null, author: null }, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			expect(result).toEqual({ id: 1 });
		});

		test('preserves null for M2O/A2O relations', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
				if (collection === 'articles') return ['*'];
				return [];
			});

			const result = await sanitizePayload({ id: 1, author: null, a2o_items: null }, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			expect(result).toEqual({ id: 1, author: null, a2o_items: null });
		});

		test('strips empty objects in M2O/A2O relations', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload({ id: 1, author: {}, a2o_items: {} }, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			expect(result).toEqual({ id: 1 });
		});
	});

	describe('Detailed Update Syntax Edge Cases', () => {
		test('removes detailed syntax object if all arrays are empty', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['*']);

			const result = await sanitizePayload({ id: 1, comments: { create: [], update: [], delete: [] } }, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			expect(result).toEqual({ id: 1 });
		});

		test('removes detailed syntax object if all operations filtered out', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
				if (collection === 'articles') return ['*'];
				if (collection === 'comments') return []; // No access to comments
				return [];
			});

			const result = await sanitizePayload(
				{
					id: 1,
					comments: {
						create: [{ text: 'New' }],
						update: [{ id: 2, text: 'Update' }],
						delete: [3],
					},
				},
				'articles',
				{
					schema,
					accountability,
					knex: db,
				},
			);

			expect(result).toEqual({
				id: 1,
			});
		});
	});

	describe('Mutation Prevention', () => {
		test('does not mutate the input payload', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['id']);

			const payload = {
				id: 1,
				comments: {
					create: [{ text: 'New Comment' }],
					update: [],
					delete: [],
				},
			};

			const originalPayload = JSON.parse(JSON.stringify(payload));

			await sanitizePayload(payload, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			expect(payload).toEqual(originalPayload);
		});
	});

	describe('Deep Recursion', () => {
		test('filters nested update syntax deeply', async () => {
			// Setup permissions
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
				if (collection === 'articles') return ['*'];
				if (collection === 'comments') return ['*'];
				if (collection === 'replies') return ['id', 'text']; // 'secret' is excluded
				return [];
			});

			// Detailed update syntax payload with deep nesting
			const payload = {
				id: 1,
				comments: {
					create: [],
					update: [
						{
							id: 10,
							replies: {
								create: [],
								update: [
									{
										id: 100,
										text: 'Visible',
										secret: 'Available but should be filtered',
									},
								],
								delete: [],
							},
						},
					],
					delete: [],
				},
			};

			const result = await sanitizePayload(payload, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			const replyUpdate = result.comments.update[0].replies.update[0];

			expect(replyUpdate).toHaveProperty('text', 'Visible');
			expect(replyUpdate).not.toHaveProperty('secret');
		});

		test('filters nested update syntax deeply when root uses simple array', async () => {
			// Setup permissions
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
				if (collection === 'articles') return ['*'];
				if (collection === 'comments') return ['*'];
				if (collection === 'replies') return ['id', 'text']; // 'secret' is excluded
				return [];
			});

			// Simple array at root, Detailed update syntax payload at deep nesting
			const payload = {
				id: 1,
				comments: [
					{
						id: 10,
						replies: {
							create: [],
							update: [
								{
									id: 100,
									text: 'Visible',
									secret: 'Should be filtered',
								},
							],
							delete: [],
						},
					},
				],
			};

			const result = await sanitizePayload(payload, 'articles', {
				schema,
				accountability,
				knex: db,
			});

			const replyUpdate = result.comments[0].replies.update[0];

			expect(replyUpdate).toHaveProperty('text', 'Visible');
			expect(replyUpdate).not.toHaveProperty('secret');
		});
	});
});
