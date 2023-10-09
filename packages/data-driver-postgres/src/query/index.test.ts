import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import type { AbstractSqlClauses } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { convertToActualStatement } from './index.js';

let sample: {
	clauses: AbstractSqlClauses;
};

let firstSelectTable: string;
let firstSelectColumn: string;
let secondSelectTable: string;
let secondSelectColumn: string;

beforeEach(() => {
	firstSelectTable = randomIdentifier();
	firstSelectColumn = randomIdentifier();
	secondSelectTable = randomIdentifier();
	secondSelectColumn = randomIdentifier();

	sample = {
		clauses: {
			select: [
				{ type: 'primitive', column: firstSelectColumn, table: firstSelectTable },
				{ type: 'primitive', column: secondSelectColumn, table: secondSelectTable },
			],
			from: randomIdentifier(),
		},
	};
});

test('basic statement', () => {
	expect(convertToActualStatement(sample.clauses)).toEqual(
		`SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${sample.clauses.from}";`
	);
});

test('statement with a limit', () => {
	sample.clauses.limit = { type: 'value', parameterIndex: 0 };

	expect(convertToActualStatement(sample.clauses)).toEqual(
		`SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${sample.clauses.from}" LIMIT $1;`
	);
});

test('statement with limit and offset', () => {
	sample.clauses.limit = { type: 'value', parameterIndex: 0 };
	sample.clauses.offset = { type: 'value', parameterIndex: 1 };

	expect(convertToActualStatement(sample.clauses)).toEqual(
		`SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${sample.clauses.from}" LIMIT $1 OFFSET $2;`
	);
});

test('statement with order', () => {
	sample.clauses.order = [
		{
			type: 'order',
			orderBy: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			direction: 'ASC',
		},
	];

	expect(convertToActualStatement(sample.clauses)).toEqual(
		`SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${
			sample.clauses.from
		}" ORDER BY "${(sample.clauses.order[0]!.orderBy as AbstractQueryFieldNodePrimitive).field}" ASC;`
	);
});

test('statement with all possible modifiers', () => {
	sample.clauses.limit = { type: 'value', parameterIndex: 0 };
	sample.clauses.offset = { type: 'value', parameterIndex: 1 };

	const firstConditionTable = randomIdentifier();
	const firstConditionColumn = randomIdentifier();
	const firstConditionParameterIndex = 2;
	const secondConditionTable = randomIdentifier();
	const secondConditionColumn = randomIdentifier();
	const secondConditionParameterIndex = 3;
	const orderField = randomIdentifier();

	sample.clauses.where = {
		type: 'logical',
		operator: 'and',
		negate: false,
		childNodes: [
			{
				type: 'condition',
				condition: {
					type: 'condition-number',
					target: {
						type: 'primitive',
						table: firstConditionTable,
						column: firstConditionColumn,
					},
					operation: 'gt',
					compareTo: {
						type: 'value',
						parameterIndex: firstConditionParameterIndex,
					},
				},
				negate: false,
			},
			{
				type: 'condition',
				condition: {
					type: 'condition-number',
					target: {
						type: 'primitive',
						table: secondConditionTable,
						column: secondConditionColumn,
					},
					operation: 'lt',
					compareTo: {
						type: 'value',
						parameterIndex: secondConditionParameterIndex,
					},
				},
				negate: false,
			},
		],
	};

	sample.clauses.order = [
		{
			type: 'order',
			orderBy: {
				type: 'primitive',
				field: orderField,
			},
			direction: 'ASC',
		},
	];

	expect(convertToActualStatement(sample.clauses)).toEqual(
		`SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${
			sample.clauses.from
		}" WHERE "${firstConditionTable}"."${firstConditionColumn}" > $${
			firstConditionParameterIndex + 1
		} AND "${secondConditionTable}"."${secondConditionColumn}" < $${
			secondConditionParameterIndex + 1
		} ORDER BY "${orderField}" ASC LIMIT $1 OFFSET $2;`
	);
});
