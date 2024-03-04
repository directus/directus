import { beforeEach, expect, test } from 'vitest';
import { randomIdentifier, randomInteger } from '@directus/random';
import { stringCondition } from './string-condition.js';
import type { SqlConditionStringNode } from '@directus/data-sql';

let sampleCondition: SqlConditionStringNode;
let tableIndex: number;
let columnName: string;
let parameterIndex: number;

beforeEach(() => {
	tableIndex = randomInteger(0, 100);
	columnName = randomIdentifier();
	parameterIndex = randomInteger(0, 100);

	sampleCondition = {
		type: 'condition-string',
		target: {
			type: 'primitive',
			tableIndex,
			columnName,
		},
		operation: 'starts_with',
		compareTo: {
			type: 'value',
			parameterIndex,
		},
	};
});

test('string condition starts_with', () => {
	const res = stringCondition(sampleCondition, false);
	const expected = `"t${tableIndex}"."${columnName}" LIKE $${parameterIndex + 1}||'%'`;
	expect(res).toStrictEqual(expected);
});

test('string condition contains', () => {
	sampleCondition.operation = 'contains';
	const res = stringCondition(sampleCondition, false);
	const expected = `"t${tableIndex}"."${columnName}" LIKE '%'||$${parameterIndex + 1}||'%'`;
	expect(res).toStrictEqual(expected);
});

test('string condition end_with', () => {
	sampleCondition.operation = 'ends_with';
	const res = stringCondition(sampleCondition, false);
	const expected = `"t${tableIndex}"."${columnName}" LIKE '%'||$${parameterIndex + 1}`;
	expect(res).toStrictEqual(expected);
});

test('string condition eq json value', () => {
	const jsonPropIndex = randomInteger(0, 20);

	sampleCondition.operation = 'eq';

	sampleCondition.target = {
		type: 'json',
		tableIndex,
		columnName: columnName,
		path: [jsonPropIndex],
	};

	const res = stringCondition(sampleCondition, false);
	const expected = `"t${tableIndex}"."${columnName}" ->> $${jsonPropIndex + 1} = $${parameterIndex + 1}`;
	expect(res).toStrictEqual(expected);
});
