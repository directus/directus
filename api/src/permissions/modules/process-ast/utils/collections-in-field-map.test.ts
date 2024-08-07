import { expect, test } from 'vitest';
import type { FieldMap } from '../types.js';
import { collectionsInFieldMap } from './collections-in-field-map.js';

test('Returns set of collections in given map', () => {
	const fieldMap: FieldMap = {
		other: new Map([['relation', { collection: 'test-collection-1', fields: new Set() }]]),
		read: new Map([['', { collection: 'test-collection-2', fields: new Set() }]]),
	};

	expect(collectionsInFieldMap(fieldMap)).toEqual(['test-collection-1', 'test-collection-2']);
});
