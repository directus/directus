import { expect, test, beforeEach } from 'vitest';
import { randomIdentifier } from '@directus/random';
import { setCondition } from './set-condition.js';
import type { SqlConditionSetNode } from '@directus/data-sql';

let tableIndex: number;
let columnName: string;
let sampleCondition: SqlConditionSetNode;

beforeEach(() => {
	columnName = randomIdentifier();

	sampleCondition = {
		type: 'condition-set',
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
	const res = setCondition(sampleCondition, false);
	const expected = `"t${tableIndex}"."${columnName}" IN ($3, $4, $5)`;
	expect(res).toStrictEqual(expected);
});

test('negated set', () => {
	const res = setCondition(sampleCondition, true);
	const expected = `"t${tableIndex}"."${columnName}" NOT IN ($3, $4, $5)`;
	expect(res).toStrictEqual(expected);
});
