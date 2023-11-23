import { beforeEach, expect, test } from 'vitest';
import { randomIdentifier, randomInteger } from '@directus/random';
import { numberCondition } from './number-condition.js';
import type { SqlConditionNumberNode } from '@directus/data-sql';

let randomTable: string;
let aColumn: string;
let parameterIndex: number;
let sampleCondition: SqlConditionNumberNode;

beforeEach(() => {
	randomTable = randomIdentifier();
	aColumn = randomIdentifier();
	parameterIndex = randomInteger(0, 100);

	sampleCondition = {
		type: 'condition-number',
		target: {
			type: 'primitive',
			table: randomTable,
			column: aColumn,
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
		`"${randomTable}"."${aColumn}" > $${parameterIndex + 1}`,
	);
});

test('number condition with function', () => {
	sampleCondition.target = {
		type: 'fn',
		fn: {
			type: 'extractFn',
			fn: 'month',
		},
		table: randomTable,
		column: aColumn,
	};

	expect(numberCondition(sampleCondition, false)).toStrictEqual(
		`EXTRACT(MONTH FROM "${randomTable}"."${aColumn}") > $${parameterIndex + 1}`,
	);
});
