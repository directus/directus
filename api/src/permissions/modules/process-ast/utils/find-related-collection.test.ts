import type { DeepPartial, SchemaOverview } from '@directus/types';
import { expect, test } from 'vitest';
import { findRelatedCollection } from './find-related-collection.js';

test('Returns null if schema overview does not contain relation for given field in given collection', () => {
	const schema: DeepPartial<SchemaOverview> = {
		relations: [],
	};

	expect(findRelatedCollection('test-collection', 'test-field', schema as SchemaOverview)).toBe(null);
});

test('Returns `related_collection` from relationship if current field is m2o fk', () => {
	const schema: DeepPartial<SchemaOverview> = {
		relations: [
			{
				collection: 'test-collection',
				field: 'test-field',
				related_collection: 'test-related-collection',
			},
		],
	};

	expect(findRelatedCollection('test-collection', 'test-field', schema as SchemaOverview)).toBe(
		'test-related-collection',
	);
});

test('Returns `collection` from relationship if current field is o2m alias', () => {
	const schema: DeepPartial<SchemaOverview> = {
		relations: [
			{
				collection: 'test-related-collection',
				field: 'test-related-field',
				related_collection: 'test-collection',
				meta: {
					one_field: 'test-field',
				},
			},
		],
	};

	expect(findRelatedCollection('test-collection', 'test-field', schema as SchemaOverview)).toBe(
		'test-related-collection',
	);
});
