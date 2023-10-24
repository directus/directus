import { beforeEach, expect, test } from 'vitest';
import { randomIdentifier, randomInteger } from '@directus/random';
import { stringCondition } from './string-condition.js';
import type { SqlConditionStringNode } from '@directus/data-sql';

let sampleCondition: SqlConditionStringNode;
let randomTable: string;
let randomColumn: string;
let parameterIndex: number;

beforeEach(() => {
	randomTable = randomIdentifier();
	randomColumn = randomIdentifier();
	parameterIndex = randomInteger(0, 100);

	sampleCondition = {
		type: 'condition-string',
		target: {
			type: 'primitive',
			table: randomTable,
			column: randomColumn,
		},
		operation: 'starts_with',
		compareTo: {
			type: 'value',
			parameterIndex,
		},
	};
});

test('letter condition starts_with', () => {
	const res = stringCondition(sampleCondition, false);
	const expected = `"${randomTable}"."${randomColumn}" LIKE '$${parameterIndex + 1}%'`;
	expect(res).toStrictEqual(expected);
});

test('letter condition contains', () => {
	sampleCondition.operation = 'contains';
	const res = stringCondition(sampleCondition, false);
	const expected = `"${randomTable}"."${randomColumn}" LIKE '%$${parameterIndex + 1}%'`;
	expect(res).toStrictEqual(expected);
});

test('letter condition contains', () => {
	sampleCondition.operation = 'ends_with';
	const res = stringCondition(sampleCondition, false);
	const expected = `"${randomTable}"."${randomColumn}" LIKE '%$${parameterIndex + 1}'`;
	expect(res).toStrictEqual(expected);
});
