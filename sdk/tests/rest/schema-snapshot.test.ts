import { describe, expect, test } from 'vitest';
import { schemaSnapshot } from '../../src/index.js';
import type { TestSchema } from '../schema.js';

describe('schemaSnapshot', () => {
	test('requests a full snapshot with no params when no options are given', () => {
		const request = schemaSnapshot<TestSchema>()();

		expect(request).toEqual({
			method: 'GET',
			path: '/schema/snapshot',
			params: {},
		});
	});

	test('sends the included collections as a comma-separated param', () => {
		const request = schemaSnapshot<TestSchema>({ includeCollections: ['collection_a', 'collection_b'] })();

		expect(request.params).toEqual({ includeCollections: 'collection_a,collection_b' });
	});

	test('sends the excluded collections as a comma-separated param', () => {
		const request = schemaSnapshot<TestSchema>({ excludeCollections: ['collection_a', 'collection_b'] })();

		expect(request.params).toEqual({ excludeCollections: 'collection_a,collection_b' });
	});

	test('throws when both includeCollections and excludeCollections are given', () => {
		expect(() =>
			schemaSnapshot<TestSchema>({
				includeCollections: ['collection_a'],
				excludeCollections: ['collection_b'],
			})(),
		).toThrow('"includeCollections" and "excludeCollections" parameters cannot be used together');
	});
});
