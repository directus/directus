import { expect, test } from 'vitest';
import type { FieldMap } from '../types.js';
import { getInfoForPath } from './get-info-for-path.js';

test.each(['other', 'read'])('Returns existing info set if exists for group %s', (group) => {
	const fieldMap: FieldMap = {
		[group]: new Map([['', { collection: 'test-collection', fields: new Set() }]]),
	} as FieldMap;

	expect(getInfoForPath(fieldMap, group as keyof FieldMap, [], 'test-collection')).toBe(
		fieldMap[group as keyof FieldMap].get(''),
	);
});

test.each(['other', 'read'])(
	'Seeds the map location with an info object if it does not exist yet for group %s',
	(group) => {
		const fieldMap: FieldMap = { read: new Map(), other: new Map() };

		const output = getInfoForPath(fieldMap, group as keyof FieldMap, [], 'test-collection');

		expect(output).toEqual({ collection: 'test-collection', fields: new Set() });
		expect(fieldMap[group as keyof FieldMap].get('')).toBe(output);
	},
);
