import { beforeEach, expect, test } from 'vitest';
import { randomIdentifier, randomInteger } from '@directus/random';
import { numberCondition } from './number-condition.js';
import type { SqlConditionNumberNode } from '@directus/data-sql';

let tableIndex: number;
let columnName: string;
let parameterIndex: number;
let sampleCondition: SqlConditionNumberNode;

beforeEach(() => {
	columnName = randomIdentifier();
	parameterIndex = randomInteger(0, 100);
	tableIndex = randomInteger(0, 100);

	sampleCondition = {
		type: 'condition-number',
		target: {
			type: 'primitive',
			tableIndex,
			columnName,
		},
		operation: 'gt',
		compareTo: {
			type: 'value',
			parameterIndex,
		},
	};
});

test('number condition', () => {
	expect(numberCondition(sampleCondition, false)).toStrictEqual(
		`"t${tableIndex}"."${columnName}" > $${parameterIndex + 1}`,
	);
});

test('number condition with function', () => {
	sampleCondition.target = {
		type: 'fn',
		fn: {
			type: 'extractFn',
			fn: 'month',
		},
		tableIndex,
		columnName: columnName,
	};

	expect(numberCondition(sampleCondition, false)).toStrictEqual(
		`EXTRACT(MONTH FROM "t${tableIndex}"."${columnName}") > $${parameterIndex + 1}`,
	);
});

test('number condition targeting json value', () => {
	const jsonPropIndex = randomInteger(0, 100);

	sampleCondition.target = {
		type: 'json',
		tableIndex,
		columnName: columnName,
		path: [jsonPropIndex],
	};

	expect(numberCondition(sampleCondition, false)).toStrictEqual(
		`CAST("t${tableIndex}"."${columnName}" -> $${jsonPropIndex + 1} AS numeric) > $${parameterIndex + 1}`,
	);
});
