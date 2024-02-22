import { expect, test, beforeEach } from 'vitest';
import { randomIdentifier } from '@directus/random';
import { setStringCondition } from './set-string-condition.js';
import type { SqlConditionSetStringNode } from '@directus/data-sql';

let tableIndex: number;
let columnName: string;
let sampleCondition: SqlConditionSetStringNode;

beforeEach(() => {
	columnName = randomIdentifier();

	sampleCondition = {
		type: 'condition-set-string',
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
	const res = setStringCondition(sampleCondition, false);
	const expected = `"t${tableIndex}"."${columnName}" IN ($3, $4, $5)`;
	expect(res).toStrictEqual(expected);
});

test('negated set', () => {
	const res = setStringCondition(sampleCondition, true);
	const expected = `"t${tableIndex}"."${columnName}" NOT IN ($3, $4, $5)`;
	expect(res).toStrictEqual(expected);
});
