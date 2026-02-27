import type { SchemaOverview } from '@directus/types';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getTemplatesApplied, templates } from './get-templates-applied.js';

afterEach(() => {
	// Restore original templates after each test
	for (const key of Object.keys(templates)) {
		delete templates[key];
	}

	vi.restoreAllMocks();
});

function schemaWithCollections(...names: string[]): SchemaOverview {
	const collections: Record<string, unknown> = {};

	for (const name of names) {
		collections[name] = { collection: name };
	}

	return { collections } as unknown as SchemaOverview;
}

describe('getTemplatesApplied', () => {
	test('returns empty array when no templates are defined', () => {
		const schema = schemaWithCollections('posts', 'authors');
		expect(getTemplatesApplied(schema)).toEqual([]);
	});

	test('returns template key when all required collections exist', () => {
		templates['blog'] = ['posts', 'authors', 'categories'];

		const schema = schemaWithCollections('posts', 'authors', 'categories', 'tags');
		expect(getTemplatesApplied(schema)).toEqual(['blog']);
	});

	test('does not return template when some collections are missing', () => {
		templates['blog'] = ['posts', 'authors', 'categories'];

		const schema = schemaWithCollections('posts', 'authors');
		expect(getTemplatesApplied(schema)).toEqual([]);
	});

	test('returns multiple matching templates', () => {
		templates['blog'] = ['posts', 'authors'];
		templates['shop'] = ['products', 'orders'];

		const schema = schemaWithCollections('posts', 'authors', 'products', 'orders');
		expect(getTemplatesApplied(schema)).toEqual(['blog', 'shop']);
	});

	test('returns only matching templates when some do not match', () => {
		templates['blog'] = ['posts', 'authors'];
		templates['shop'] = ['products', 'orders'];

		const schema = schemaWithCollections('posts', 'authors');
		expect(getTemplatesApplied(schema)).toEqual(['blog']);
	});

	test('returns empty array when schema has no collections', () => {
		templates['blog'] = ['posts', 'authors'];

		const schema = schemaWithCollections();
		expect(getTemplatesApplied(schema)).toEqual([]);
	});
});
