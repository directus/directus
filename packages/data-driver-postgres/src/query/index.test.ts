import type { AbstractQueryFieldNodePrimitive } from '@directus/data';
import type { AbstractSqlQuery } from '@directus/data-sql';
import { randomIdentifier, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { constructSqlQuery } from './index.js';

let sample: {
	statement: AbstractSqlQuery;
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
		statement: {
			select: [
				{ type: 'primitive', column: firstSelectColumn, table: firstSelectTable },
				{ type: 'primitive', column: secondSelectColumn, table: secondSelectTable },
			],
			from: randomIdentifier(),
			parameters: [],
		},
	};
});

test('basic statement', () => {
	expect(constructSqlQuery(sample.statement)).toEqual({
		statement: `SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${sample.statement.from}";`,
		parameters: [],
	});
});

test('statement with a limit', () => {
	sample.statement.limit = { parameterIndex: 0 };
	sample.statement.parameters = [randomInteger(1, 100)];

	expect(constructSqlQuery(sample.statement)).toEqual({
		statement: `SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${sample.statement.from}" LIMIT $1;`,
		parameters: sample.statement.parameters,
	});
});

test('statement with limit and offset', () => {
	sample.statement.limit = { parameterIndex: 0 };
	sample.statement.offset = { parameterIndex: 1 };
	sample.statement.parameters = [randomInteger(1, 100), randomInteger(1, 100)];

	expect(constructSqlQuery(sample.statement)).toEqual({
		statement: `SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${sample.statement.from}" LIMIT $1 OFFSET $2;`,
		parameters: sample.statement.parameters,
	});
});

test('statement with order', () => {
	sample.statement.order = [
		{
			type: 'order',
			orderBy: {
				type: 'primitive',
				field: randomIdentifier(),
			},
			direction: 'ASC',
		},
	];

	expect(constructSqlQuery(sample.statement)).toEqual({
		statement: `SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${
			sample.statement.from
		}" ORDER BY "${(sample.statement.order[0]!.orderBy as AbstractQueryFieldNodePrimitive).field}" ASC;`,
		parameters: sample.statement.parameters,
	});
});

test('statement with all possible modifiers', () => {
	sample.statement.limit = { parameterIndex: 0 };
	sample.statement.offset = { parameterIndex: 1 };

	// variables to easily access the values from the expected statement
	const firstConditionTable = randomIdentifier();
	const firstConditionColumn = randomIdentifier();
	const firstConditionParameterIndex = 2;
	const secondConditionTable = randomIdentifier();
	const secondConditionColumn = randomIdentifier();
	const secondConditionParameterIndex = 3;
	const orderField = randomIdentifier();

	sample.statement.where = {
		type: 'logical',
		operator: 'and',
		negate: false,
		childNodes: [
			{
				type: 'condition',
				condition: {
					type: 'number-condition',
					operation: 'gt',
					target: {
						type: 'primitive',
						table: firstConditionTable,
						column: firstConditionColumn,
					},
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
					type: 'number-condition',
					operation: 'lt',
					target: {
						type: 'primitive',
						table: secondConditionTable,
						column: secondConditionColumn,
					},
					compareTo: {
						type: 'value',
						parameterIndex: secondConditionParameterIndex,
					},
				},
				negate: false,
			},
		],
	};

	sample.statement.order = [
		{
			type: 'order',
			orderBy: {
				type: 'primitive',
				field: orderField,
			},
			direction: 'ASC',
		},
	];

	sample.statement.parameters = [
		randomInteger(1, 100),
		randomInteger(1, 100),
		randomInteger(1, 100),
		randomInteger(1, 100),
	];

	expect(constructSqlQuery(sample.statement)).toEqual({
		statement: `SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${
			sample.statement.from
		}" WHERE "${firstConditionTable}"."${firstConditionColumn}" > $${
			firstConditionParameterIndex + 1
		} AND "${secondConditionTable}"."${secondConditionColumn}" < $${
			secondConditionParameterIndex + 1
		} ORDER BY "${orderField}" ASC LIMIT $1 OFFSET $2;`,
		parameters: sample.statement.parameters,
	});
});
