import { SchemaBuilder } from '@directus/schema-builder';
import type { Accountability } from '@directus/types';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { sanitizePayload, validateChanges } from './payload-permissions.js';
import { verifyPermissions } from './verify-permissions.js';

vi.mock('./verify-permissions.js');

const schema = new SchemaBuilder()
	.collection('articles', (c) => {
		c.field('id').id();
		c.field('title').string();
		c.field('status').string();
		c.field('author').m2o('authors');
		c.field('field1').string();
		c.field('field2').string();
		c.field('field3').string();
		c.field('field4').string();
		c.field('field5').string();
		c.field('comments').o2m('comments', 'article_id');
	})
	.collection('comments', (c) => {
		c.field('id').id();
		c.field('text').string();
		c.field('article_id').integer();
	})
	.collection('authors', (c) => {
		c.field('id').id();
		c.field('name').string();
	})
	.build();

beforeEach(() => {
	vi.clearAllMocks();
});

const accountability = { user: 'test-user', roles: ['test-role'] } as Accountability;

const mockContext = {
	knex: {} as any,
	schema,
	accountability,
};

describe('Payload Permissions Caching', () => {
	test('deduplicates verifyPermissions calls for multiple fields on the same item', async () => {
		vi.mocked(verifyPermissions).mockResolvedValue(['*']);

		const payload = {
			title: 'A',
			status: 'B',
			$type: 'metadata', // Should be ignored by permission check
		};

		await sanitizePayload(payload, 'articles', mockContext);

		const articleCalls = vi.mocked(verifyPermissions).mock.calls.filter((c) => c[1] === 'articles');
		expect(articleCalls).toHaveLength(1);
	});

	test('validates cache persistence across deep recursion', async () => {
		vi.mocked(verifyPermissions).mockImplementation(async (_acc, collection) => {
			if (collection === 'articles') return ['*'];
			if (collection === 'comments') return ['*'];
			return [];
		});

		const payload = {
			title: 'Article',
			comments: [
				{ id: 1, text: 'Comment 1' },
				{ id: 1, text: 'Duplicate Reference to Comment 1' }, // Should be cached
				{ id: 2, text: 'Comment 2' },
			],
		};

		await sanitizePayload(payload, 'articles', mockContext);

		const commentCalls = vi.mocked(verifyPermissions).mock.calls.filter((c) => c[1] === 'comments');
		expect(commentCalls).toHaveLength(2);
		const id1Calls = commentCalls.filter((c) => c[2] === 1);
		expect(id1Calls).toHaveLength(1);
	});

	test('is not shared between independent function calls', async () => {
		vi.mocked(verifyPermissions).mockResolvedValue(['*']);

		const payload = { title: 'A' };

		await sanitizePayload(payload, 'articles', mockContext);
		expect(verifyPermissions).toHaveBeenCalledTimes(1);

		await sanitizePayload(payload, 'articles', mockContext);

		expect(verifyPermissions).toHaveBeenCalledTimes(2);
	});

	test('handles different actions as different cache keys', async () => {
		vi.mocked(verifyPermissions).mockResolvedValue(['*']);

		vi.mocked(verifyPermissions).mockImplementation(async (_acc, _col, _id, action) => {
			if (action === 'update') return null; // Trigger fallback to create
			return ['*'];
		});

		await validateChanges({ title: 'New Article' }, 'articles', 1, mockContext);

		const calls = vi.mocked(verifyPermissions).mock.calls;
		expect(calls.some((c) => c[3] === 'update')).toBe(true); // Failed update
		expect(calls.some((c) => c[3] === 'create')).toBe(true); // Fallback create
	});

	test('handles concurrent lookups correctly', async () => {
		let callCount = 0;

		vi.mocked(verifyPermissions).mockImplementation(async () => {
			callCount++;
			await new Promise((resolve) => setTimeout(resolve, 50));
			return ['*'];
		});

		const payload = {
			field1: 'A',
			field2: 'B',
			field3: 'C',
			field4: 'D',
			field5: 'E',
		};

		await sanitizePayload(payload, 'articles', mockContext); // Fields processed in parallel

		expect(callCount).toBe(1); // Locked onto the first promise
	});

	test('isolates cache by collection', async () => {
		vi.mocked(verifyPermissions).mockResolvedValue(['*']);

		const payload = {
			title: 'Article',
			author: { id: 10, name: 'Author' },
		};

		await sanitizePayload(payload, 'articles', mockContext);

		const calls = vi.mocked(verifyPermissions).mock.calls;
		expect(calls.find((c) => c[1] === 'articles')).toBeDefined();
		expect(calls.find((c) => c[1] === 'authors')).toBeDefined();
		expect(calls).toHaveLength(2);
	});
});
