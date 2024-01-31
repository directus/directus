import type { AbstractSqlClauses } from '@directus/data-sql';
import { randomIdentifier, randomInteger } from '@directus/random';
import { beforeEach, expect, test } from 'vitest';
import { convertToActualStatement } from './index.js';

let sample: AbstractSqlClauses;

let rootTableName: string;
let rootTableIndex: number;
let rootSelectColumn1Name: string;
let rootSelectColumn1Index: number;
let rootSelectTable1Index: number;
let rootSelectColumn2Name: string;
let rootSelectColumn2Index: number;
let baseStatement: string;

beforeEach(() => {
	rootTableName = randomIdentifier();
	rootTableIndex = randomInteger(0, 100);
	rootSelectColumn1Name = randomIdentifier();
	rootSelectColumn1Index = randomInteger(0, 100);
	rootSelectTable1Index = randomInteger(0, 100);
	rootSelectColumn2Name = randomIdentifier();
	rootSelectColumn2Index = randomInteger(0, 100);

	sample = {
		select: [
			{
				type: 'primitive',
				tableIndex: rootTableIndex,
				columnName: rootSelectColumn1Name,
				columnIndex: rootSelectColumn1Index,
			},
			{
				type: 'primitive',
				tableIndex: rootSelectTable1Index,
				columnName: rootSelectColumn2Name,
				columnIndex: rootSelectColumn2Index,
			},
		],
		from: {
			tableName: rootTableName,
			tableIndex: rootTableIndex,
		},
	};

	baseStatement = `SELECT "t${rootTableIndex}"."${rootSelectColumn1Name}" AS "c${rootSelectColumn1Index}", "t${rootSelectTable1Index}"."${rootSelectColumn2Name}" AS "c${rootSelectColumn2Index}" FROM "${rootTableName}" AS "t${rootTableIndex}"`;
});

test('basic statement', () => {
	expect(convertToActualStatement(sample)).toEqual(`${baseStatement};`);
});

test('statement with a limit', () => {
	sample.limit = { type: 'value', parameterIndex: 0 };
	expect(convertToActualStatement(sample)).toEqual(`${baseStatement} LIMIT $1;`);
});

test('statement with limit and offset', () => {
	sample.limit = { type: 'value', parameterIndex: 0 };
	sample.offset = { type: 'value', parameterIndex: 1 };
	expect(convertToActualStatement(sample)).toEqual(`${baseStatement} LIMIT $1 OFFSET $2;`);
});

test('statement with order', () => {
	const orderField = randomIdentifier();
	const tableIndex = randomInteger(0, 100);

	sample.order = [
		{
			type: 'order',
			orderBy: {
				type: 'primitive',
				columnName: orderField,
				tableIndex,
			},
			direction: 'ASC',
		},
	];

	expect(convertToActualStatement(sample)).toEqual(`${baseStatement} ORDER BY "t${tableIndex}"."${orderField}" ASC;`);
});

test('statement with all possible local modifiers', () => {
	sample.limit = { type: 'value', parameterIndex: 0 };
	sample.offset = { type: 'value', parameterIndex: 1 };

	const firstConditionTableIndex = randomInteger(0, 100);
	const firstConditionColumn = randomIdentifier();
	const firstConditionParameterIndex = 2;
	const secondConditionTableIndex = randomInteger(0, 100);
	const secondConditionColumn = randomIdentifier();
	const secondConditionParameterIndex = 3;
	const orderField = randomIdentifier();
	const sortTableIndex = randomInteger(0, 100);

	sample.where = {
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
						tableIndex: firstConditionTableIndex,
						columnName: firstConditionColumn,
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
						tableIndex: secondConditionTableIndex,
						columnName: secondConditionColumn,
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

	sample.order = [
		{
			type: 'order',
			orderBy: {
				type: 'primitive',
				columnName: orderField,
				tableIndex: sortTableIndex,
			},
			direction: 'ASC',
		},
	];

	expect(convertToActualStatement(sample)).toEqual(
		`${baseStatement} WHERE "t${firstConditionTableIndex}"."${firstConditionColumn}" > $${
			firstConditionParameterIndex + 1
		} AND "t${secondConditionTableIndex}"."${secondConditionColumn}" < $${
			secondConditionParameterIndex + 1
		} ORDER BY "t${sortTableIndex}"."${orderField}" ASC LIMIT $1 OFFSET $2;`,
	);
});

test('statement with all filter on foreign field', () => {
	const foreignTable = randomIdentifier();
	const foreignTableIndex = randomInteger(0, 100);
	const foreignColumn = randomIdentifier();
	const leftHandIdentifierField = randomIdentifier();
	const rootCollectionIndex = randomInteger(0, 100);
	const parameterIndex = 0;

	sample.joins = [
		{
			type: 'join',
			tableName: foreignTable,
			tableIndex: foreignTableIndex,
			on: {
				type: 'condition',
				condition: {
					type: 'condition-field',
					target: {
						type: 'primitive',
						tableIndex: foreignTableIndex,
						columnName: foreignColumn,
					},
					operation: 'eq',
					compareTo: {
						type: 'primitive',
						tableIndex: rootCollectionIndex,
						columnName: leftHandIdentifierField,
					},
				},
				negate: false,
			},
		},
	];

	sample.where = {
		type: 'condition',
		negate: false,
		condition: {
			type: 'condition-string',
			target: {
				type: 'primitive',
				tableIndex: foreignTableIndex,
				columnName: foreignColumn,
			},
			operation: 'starts_with',
			compareTo: {
				type: 'value',
				parameterIndex,
			},
		},
	};

	expect(convertToActualStatement(sample)).toEqual(
		`${baseStatement} LEFT JOIN "${foreignTable}" AS "t${foreignTableIndex}" ON "t${foreignTableIndex}"."${foreignColumn}" = "t${rootCollectionIndex}"."${leftHandIdentifierField}" WHERE "t${foreignTableIndex}"."${foreignColumn}" LIKE $${
			parameterIndex + 1
		}||'%';`,
	);
});
