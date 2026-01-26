import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { validateChanges } from './validate-changes.js';
import { verifyPermissions } from './verify-permissions.js';

vi.mock('./verify-permissions.js');

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('author').m2o('authors');
		c.field('secret').hash();
		c.field('comments').o2m('comments', 'article_id');
	})
	.collection('authors', (c) => {
		c.field('id').id();
		c.field('name').string();
		c.field('biography').string();
	})
	.collection('comments', (c) => {
		c.field('id').id();
		c.field('text').string();
		c.field('article_id').integer();
	})
	.build();

beforeEach(() => {
	vi.clearAllMocks();
});

const accountability = { user: 'test-user', roles: ['test-role'] } as Accountability;
const mockKnex = {} as any;

const mockContext = {
	knex: mockKnex,
	schema,
	accountability,
};

describe('validateChanges', () => {
	describe('Basic Permissions', () => {
		test('validates simple field updates', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['title']);

			const payload = { title: 'New Title' };
			await expect(validateChanges(payload, 'articles', 1, mockContext)).resolves.not.toThrow();
		});

		test('throws error on unauthorized simple field', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['title']);

			const payload = { secret: 'Unauthorized' };

			await expect(validateChanges(payload, 'articles', 1, mockContext)).rejects.toThrow(
				'No permission to update field secret or field does not exist',
			);
		});

		test('throws on unknown fields', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['title']);

			const payload = { non_existent: 'Value' };

			await expect(validateChanges(payload, 'articles', 1, mockContext)).rejects.toThrow(
				'No permission to update field non_existent or field does not exist',
			);
		});
	});

	describe('Relational Permissions', () => {
		describe('M2O', () => {
			test('validates nested M2O update (authorized)', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, coll) => {
					if (coll === 'articles') return ['author'];
					if (coll === 'authors') return ['name'];
					return [];
				});

				const payload = { author: { id: 10, name: 'New Author Name' } };

				await expect(validateChanges(payload, 'articles', 1, mockContext)).resolves.not.toThrow();
			});

			test('throws on unauthorized nested M2O field', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, coll) => {
					if (coll === 'articles') return ['author'];
					if (coll === 'authors') return ['name'];
					return [];
				});

				const payload = { author: { id: 10, biography: 'Unauthorized Bio' } };

				await expect(validateChanges(payload, 'articles', 1, mockContext)).rejects.toThrow(
					'No permission to update field biography or field does not exist',
				);
			});
		});

		describe('O2M', () => {
			test('validates O2M detailed update syntax (create/update/delete)', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, coll, _item, action) => {
					if (coll === 'articles') return ['comments'];
					if (coll === 'comments') return action === 'delete' ? ['*'] : ['text'];
					return [];
				});

				const payload = {
					comments: {
						create: [{ text: 'New Comment' }],
						update: [{ id: 100, text: 'Updated Comment' }],
						delete: [101],
					},
				};

				await expect(validateChanges(payload, 'articles', 1, mockContext)).resolves.not.toThrow();
			});

			test('throws on unauthorized field in O2M create', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, coll) => {
					if (coll === 'articles') return ['comments'];
					if (coll === 'comments') return ['text'];
					return [];
				});

				const payload = {
					comments: {
						create: [{ id: 500, text: 'Unauthorized ID' }],
						update: [],
						delete: [],
					},
				};

				await expect(validateChanges(payload, 'articles', 1, mockContext)).rejects.toThrow(
					'No permission to create field id or field does not exist',
				);
			});

			test('throws on unauthorized delete in O2M', async () => {
				vi.mocked(verifyPermissions).mockImplementation(async (_acc, coll, item, action) => {
					if (coll === 'articles') return ['comments'];

					if (coll === 'comments') {
						if (action === 'delete') {
							if (item === 100) return [];
							return ['*'];
						}

						return ['*'];
					}

					return [];
				});

				const payload = {
					comments: {
						create: [],
						update: [],
						delete: [100],
					},
				};

				await expect(validateChanges(payload, 'articles', 1, mockContext)).rejects.toThrow(
					'No permission to delete item in collection comments',
				);

				expect(verifyPermissions).toHaveBeenCalledWith(
					expect.anything(),
					'comments',
					100, // The item ID, not the parent item ID or null
					'delete',
					expect.anything(),
				);
			});

			test('throws on unexpected field in delete', async () => {
				const payload = {
					comments: {
						create: [],
						update: [],
						delete: [{ id: 1, name: 'extra' }],
					},
				};

				await expect(validateChanges(payload, 'articles', 1, mockContext)).rejects.toThrow(
					'No permission to update field name or field does not exist',
				);
			});

			test('throws on unknown field sneaked into detailed update syntax', async () => {
				const payload = {
					comments: {
						create: [],
						update: [],
						delete: [],
						malicious: 'field',
					},
				};

				await expect(validateChanges(payload, 'articles', 1, mockContext)).rejects.toThrow(
					'No permission to update field malicious or field does not exist',
				);
			});
		});
	});

	describe('Item Existence Handling', () => {
		test('handles new items with manually provided IDs (existence check)', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, coll, item, action) => {
				if (coll === 'articles') return ['author'];

				if (coll === 'authors') {
					if (item === 999 && action === 'update') return null;
					if (action === 'create') return ['id', 'name'];
				}

				return [];
			});

			const payload = { author: { id: 999, name: 'New Created Author' } };

			await expect(validateChanges(payload, 'articles', 1, mockContext)).resolves.not.toThrow();
		});

		test('validates top-level create when itemId is null', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, coll, _item, action) => {
				if (coll === 'articles' && action === 'create') return ['title'];
				return [];
			});

			const payload = { title: 'New Article' };

			await expect(validateChanges(payload, 'articles', null, mockContext)).resolves.not.toThrow();

			expect(verifyPermissions).toHaveBeenCalledWith(expect.anything(), 'articles', null, 'create', expect.anything());
		});
	});

	describe('Metadata Handling', () => {
		test('ignores $ metadata keys at the top level', async () => {
			vi.mocked(verifyPermissions).mockResolvedValue(['title']);

			const payload = {
				title: 'New Title',
				$type: 'updated',
				$index: 0,
			};

			await expect(validateChanges(payload, 'articles', 1, mockContext)).resolves.not.toThrow();
		});

		test('ignores $ metadata keys inside detailed update syntax', async () => {
			vi.mocked(verifyPermissions).mockImplementation(async (_acc, coll, _item, action) => {
				if (coll === 'articles') return ['comments'];
				if (coll === 'comments') return action === 'delete' ? ['*'] : ['text'];
				return [];
			});

			const payload = {
				comments: {
					create: [{ text: 'New Comment', $type: 'created' }],
					update: [{ id: 100, text: 'Updated Comment', $index: 0 }],
					delete: [101],
					$type: 'updated',
				},
			};

			await expect(validateChanges(payload, 'articles', 1, mockContext)).resolves.not.toThrow();
		});
	});
});
