import { expect, test } from 'vitest';
import type { FieldMap } from '../types.js';
import { collectionsInFieldMap } from './collections-in-field-map.js';

test('Returns set of collections in given map', () => {
	const fieldMap: FieldMap = new Map([
		['', { collection: 'test-collection-1', fields: new Set() }],
		['relation', { collection: 'test-collection-2', fields: new Set() }],
	]);

	expect(collectionsInFieldMap(fieldMap)).toEqual(new Set(['test-collection-1', 'test-collection-2']));
});
