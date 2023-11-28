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
		`SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${sample.clauses.from}";`,
	);
});

test('statement with a limit', () => {
	sample.clauses.limit = { type: 'value', parameterIndex: 0 };

	expect(convertToActualStatement(sample.clauses)).toEqual(
		`SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${sample.clauses.from}" LIMIT $1;`,
	);
});

test('statement with limit and offset', () => {
	sample.clauses.limit = { type: 'value', parameterIndex: 0 };
	sample.clauses.offset = { type: 'value', parameterIndex: 1 };

	expect(convertToActualStatement(sample.clauses)).toEqual(
		`SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${sample.clauses.from}" LIMIT $1 OFFSET $2;`,
	);
});

test('statement with order', () => {
	const orderField = randomIdentifier();
	const table = randomIdentifier();

	sample.clauses.order = [
		{
			type: 'order',
			orderBy: {
				type: 'primitive',
				column: orderField,
				table: table,
			},
			direction: 'ASC',
		},
	];

	expect(convertToActualStatement(sample.clauses)).toEqual(
		`SELECT "${firstSelectTable}"."${firstSelectColumn}", "${secondSelectTable}"."${secondSelectColumn}" FROM "${sample.clauses.from}" ORDER BY "${table}"."${orderField}" ASC;`,
	);
});

test('statement with all possible local modifiers', () => {
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

	const sortTable = randomIdentifier();

	sample.clauses.order = [
		{
			type: 'order',
			orderBy: {
				type: 'primitive',
				column: orderField,
				table: sortTable,
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
		} ORDER BY "${sortTable}"."${orderField}" ASC LIMIT $1 OFFSET $2;`,
	);
});

test('statement with all filter on foreign field', () => {
	const foreignCollection = randomIdentifier();
	const targetField = randomIdentifier();
	const leftHandIdentifierField = randomIdentifier();
	const joinAlias = randomIdentifier();
	const firstField = randomIdentifier();
	const secondField = randomIdentifier();
	const rootCollection = randomIdentifier();
	const parameterIndex = 0;

	const clauses: AbstractSqlClauses = {
		select: [
			{
				type: 'primitive',
				table: rootCollection,
				column: firstField,
			},
			{
				type: 'primitive',
				table: rootCollection,
				column: secondField,
			},
		],
		from: rootCollection,
		joins: [
			{
				type: 'join',
				table: foreignCollection,
				on: {
					type: 'condition',
					condition: {
						type: 'condition-field',
						target: {
							type: 'primitive',
							table: foreignCollection,
							column: targetField,
						},
						operation: 'eq',
						compareTo: {
							type: 'primitive',
							table: rootCollection,
							column: leftHandIdentifierField,
						},
					},
					negate: false,
				},
				as: joinAlias,
			},
		],
		where: {
			type: 'condition',
			negate: false,
			condition: {
				type: 'condition-string',
				target: {
					type: 'primitive',
					table: foreignCollection,
					column: targetField,
				},
				operation: 'starts_with',
				compareTo: {
					type: 'value',
					parameterIndex,
				},
			},
		},
	};

	expect(convertToActualStatement(clauses)).toEqual(
		`SELECT "${rootCollection}"."${firstField}", "${rootCollection}"."${secondField}" FROM "${rootCollection}" LEFT JOIN "${foreignCollection}" "${joinAlias}" ON "${foreignCollection}"."${targetField}" = "${rootCollection}"."${leftHandIdentifierField}" WHERE "${foreignCollection}"."${targetField}" LIKE $${
			parameterIndex + 1
		}||'%';`,
	);
});
