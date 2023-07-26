import { beforeEach, expect, test } from 'vitest';
import { randomIdentifier, randomInteger } from '@directus/random';
import { letterCondition } from './letter-condition.js';
import type { SqlConditionLetterNode } from '@directus/data-sql';

let sampleCondition: SqlConditionLetterNode;
let randomTable: string;
let randomColumn: string;
let parameterIndex: number;

beforeEach(() => {
	randomTable = randomIdentifier();
	randomColumn = randomIdentifier();
	parameterIndex = randomInteger(0, 100);

	sampleCondition = {
		type: 'condition-letter',
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
	expect(letterCondition(sampleCondition, false)).toStrictEqual(
		`"${randomTable}"."${randomColumn}" LIKE '$${parameterIndex + 1}%'`
	);
});

test('letter condition contains', () => {
	sampleCondition.operation = 'contains';

	expect(letterCondition(sampleCondition, false)).toStrictEqual(
		`"${randomTable}"."${randomColumn}" LIKE '%$${parameterIndex + 1}%'`
	);
});

test('letter condition contains', () => {
	sampleCondition.operation = 'ends_with';

	expect(letterCondition(sampleCondition, false)).toStrictEqual(
		`"${randomTable}"."${randomColumn}" LIKE '%$${parameterIndex + 1}'`
	);
});
