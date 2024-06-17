import { expect, test } from 'vitest';
import type { FieldMap } from '../types.js';
import { getInfoForPath } from './get-info-for-path.js';

test('Returns existing info set if exists', () => {
	const fieldMap: FieldMap = new Map([['', { collection: 'test-collection', fields: new Set() }]]);
	expect(getInfoForPath(fieldMap, [], 'test-collection')).toBe(fieldMap.get(''));
});

test('Seeds the map location with an info object if it does not exist yet', () => {
	const fieldMap: FieldMap = new Map();

	const output = getInfoForPath(fieldMap, [], 'test-collection');

	expect(output).toEqual({ collection: 'test-collection', fields: new Set() });
	expect(fieldMap.get('')).toBe(output);
});
