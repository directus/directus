import { describe, expect, test } from 'vitest';
import { createItem, createItems } from '../../src/index.js';
import type { TestSchema } from '../schema.js';

describe('createItem', () => {
	test('creates single item for non-core collections', () => {
		const request = createItem<TestSchema, 'collection_a', any>('collection_a', { string_field: 'test' })();

		expect(request.method).toBe('POST');
		expect(request.path).toBe('/items/collection_a');
	});

	test('defaults params to empty object when query is omitted', () => {
		const request = createItem<TestSchema, 'collection_a', any>('collection_a', { string_field: 'test' })();

		expect(request.params).toEqual({});
	});

	test('throws when using core collections', () => {
		expect(() => createItem<TestSchema, 'directus_users', any>('directus_users', { custom_field: false })()).toThrow(
			'Cannot use createItem for core collections',
		);
	});
});

describe('createItems', () => {
	test('creates items for non-core collections', () => {
		const request = createItems<TestSchema, 'collection_a', any>('collection_a', [{ string_field: 'test' }])();

		expect(request).toEqual({
			path: '/items/collection_a',
			method: 'POST',
			params: {},
			body: JSON.stringify([{ string_field: 'test' }]),
		});
	});

	test('defaults params to empty object when query is omitted', () => {
		const request = createItems<TestSchema, 'collection_a', any>('collection_a', [{ string_field: 'test' }])();

		expect(request.params).toEqual({});
	});

	test('throws when using core collections', () => {
		expect(() => createItems<TestSchema, 'directus_users', any>('directus_users', [{ custom_field: false }])()).toThrow(
			'Cannot use createItems for core collections',
		);
	});
});
