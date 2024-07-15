import type { SchemaOverview } from '@directus/types';
import { expect, test } from 'vitest';
import { fieldMapFromFields } from './field-map-from-fields.js';

test('Extracts top level fields', () => {
	const schema = {} as SchemaOverview;
	const fieldMap = {};

	const fields = ['field-a', 'field-b'];

	fieldMapFromFields('collection', fields, schema, fieldMap);

	expect(fieldMap).toEqual({
		collection: ['field-a', 'field-b'],
	});
});

test('Extracts nested fields', () => {
	const fieldMap = {};

	const fields = [''];
});
