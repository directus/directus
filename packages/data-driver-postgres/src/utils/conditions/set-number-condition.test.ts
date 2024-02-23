import { expect, test, beforeEach } from 'vitest';
import { randomIdentifier, randomInteger } from '@directus/random';
import { setNumberCondition } from './set-number-condition.js';
import type { SqlConditionSetNumberNode } from '@directus/data-sql';

let tableIndex: number;
let columnName: string;
let sampleCondition: SqlConditionSetNumberNode;

beforeEach(() => {
	columnName = randomIdentifier();
	tableIndex = randomInteger(0, 100);

	sampleCondition = {
		type: 'condition-set-number',
		target: {
			type: 'primitive',
			tableIndex,
			columnName,
		},
		operation: 'in',
		compareTo: {
			type: 'values',
			parameterIndexes: [2, 3, 4],
		},
	};
});

test('set', () => {
	const res = setNumberCondition(sampleCondition, false);
	const expected = `"t${tableIndex}"."${columnName}" IN ($3, $4, $5)`;
	expect(res).toStrictEqual(expected);
});

test('negated set', () => {
	const res = setNumberCondition(sampleCondition, true);
	const expected = `"t${tableIndex}"."${columnName}" NOT IN ($3, $4, $5)`;
	expect(res).toStrictEqual(expected);
});

test('set with json integer target', () => {
	sampleCondition.target = {
		type: 'json',
		tableIndex,
		columnName,
		path: [5, 6],
	};

	const res = setNumberCondition(sampleCondition, false);
	const expected = `CAST("t${tableIndex}"."${columnName}" -> $6 -> $7 AS numeric) IN ($3, $4, $5)`;
	expect(res).toStrictEqual(expected);
});
