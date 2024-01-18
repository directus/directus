import { expect, test } from 'vitest';
import { findIndexForColumn } from './findex-finder.js';
import type { AliasMapping } from '../../index.js';
import { randomInteger } from '@directus/random';

test('findIndex', () => {
	const columnIndex = randomInteger(0, 100);

	const mapping: AliasMapping = [
		{
			type: 'root',
			alias: 'id',
			columnIndex,
		},
	];

	const res = findIndexForColumn(mapping, 'id');

	expect(res).toBe(columnIndex);
});
