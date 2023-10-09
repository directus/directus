import { expect, test, beforeEach } from 'vitest';
import { randomIdentifier } from '@directus/random';
import { setCondition } from './set-condition.js';
import type { SqlConditionSetNode } from '@directus/data-sql';

let randomTable: string;
let randomColumn: string;
let sampleCondition: SqlConditionSetNode;

beforeEach(() => {
	randomTable = randomIdentifier();
	randomColumn = randomIdentifier();

	sampleCondition = {
		type: 'condition-set',
		target: {
			type: 'primitive',
			table: randomTable,
			column: randomColumn,
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
	const expected = `"${randomTable}"."${randomColumn}" IN ($3, $4, $5)`;
	expect(res).toStrictEqual(expected);
});

test('negated set', () => {
	const res = setCondition(sampleCondition, true);
	const expected = `"${randomTable}"."${randomColumn}" NOT IN ($3, $4, $5)`;
	expect(res).toStrictEqual(expected);
});
