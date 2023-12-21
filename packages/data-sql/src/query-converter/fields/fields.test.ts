import type { AbstractQueryFieldNode } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../../utils/create-index-generators.js';
import { convertFieldNodes, type FieldConversionResult } from './fields.js';

test('primitives only', () => {
	const tableIndex = randomInteger(0, 100);
	const column1Name = randomIdentifier();
	const column1Index = 0;
	const column1Alias = randomIdentifier();
	const column2Name = randomIdentifier();
	const column2Index = 1;
	const column2Alias = randomIdentifier();

	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: column1Name,
			alias: column1Alias,
		},
		{
			type: 'primitive',
			field: column2Name,
			alias: column2Alias,
		},
	];

	const expectedResult: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					tableIndex,
					columnName: column1Name,
					columnIndex: column1Index,
				},
				{
					type: 'primitive',
					tableIndex,
					columnName: column2Name,
					columnIndex: column2Index,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: [
			{ type: 'root', alias: column1Alias, columnIndex: column1Index },
			{ type: 'root', alias: column2Alias, columnIndex: column2Index },
		],
		subQueries: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertFieldNodes(fields, tableIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});

test('primitive, fn', () => {
	const tableIndex = randomInteger(0, 100);
	const column1Name = randomIdentifier();
	const column1Index = 0;
	const column1Alias = randomIdentifier();
	const column2Name = randomIdentifier();
	const column2Index = 1;
	const column2Alias = randomIdentifier();

	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: column1Name,
			alias: column1Alias,
		},
		{
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: column2Name,
			alias: column2Alias,
		},
	];

	const expectedResult: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					tableIndex,
					columnName: column1Name,
					columnIndex: column1Index,
				},
				{
					type: 'fn',
					fn: {
						type: 'extractFn',
						fn: 'month',
					},
					tableIndex,
					columnName: column2Name,
					columnIndex: column2Index,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: [
			{ type: 'root', alias: column1Alias, columnIndex: column1Index },
			{ type: 'root', alias: column2Alias, columnIndex: column2Index },
		],
		subQueries: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertFieldNodes(fields, tableIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});

test('primitive, fn, m2o', () => {
	const tableIndex = randomInteger(0, 100);
	const column1Name = randomIdentifier();
	const column1Index = 0;
	const column1Alias = randomIdentifier();
	const column2Name = randomIdentifier();
	const column2Index = 2;
	const column2Alias = randomIdentifier();
	const foreignKeyColumnName = randomIdentifier();

	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalTableIndex = 0;
	const externalAlias = randomIdentifier();
	const externalColumnName = randomIdentifier();
	const externalColumnIndex = 1;
	const externalColumnAlias = randomIdentifier();
	const externalKeyColumnName = randomIdentifier();

	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: column1Name,
			alias: column1Alias,
		},
		{
			type: 'nested-single-one',
			fields: [
				{
					type: 'primitive',
					field: externalColumnName,
					alias: externalColumnAlias,
				},
			],
			nesting: {
				type: 'relational-many',

				local: {
					fields: [foreignKeyColumnName],
				},
				foreign: {
					store: externalStore,
					collection: externalTableName,
					fields: [externalKeyColumnName],
				},
			},
			alias: externalAlias,
		},
		{
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: column2Name,
			alias: column2Alias,
		},
	];

	const expectedResult: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					tableIndex,
					columnName: column1Name,
					columnIndex: column1Index,
				},
				{
					type: 'primitive',
					tableIndex: externalTableIndex,
					columnName: externalColumnName,
					columnIndex: externalColumnIndex,
				},
				{
					type: 'fn',
					fn: {
						type: 'extractFn',
						fn: 'month',
					},
					tableIndex,
					columnName: column2Name,
					columnIndex: column2Index,
				},
			],
			joins: [
				{
					type: 'join',
					tableName: externalTableName,
					tableIndex: externalTableIndex,
					on: {
						type: 'condition',
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								tableIndex,
								columnName: foreignKeyColumnName,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								tableIndex: externalTableIndex,
								columnName: externalKeyColumnName,
							},
						},
						negate: false,
					},
				},
			],
		},
		parameters: [],
		aliasMapping: [
			{
				type: 'root',
				alias: column1Alias,
				columnIndex: column1Index,
			},
			{
				type: 'nested',
				alias: externalAlias,
				children: [{ type: 'root', alias: externalColumnAlias, columnIndex: externalColumnIndex }],
			},
			{
				type: 'root',
				alias: column2Alias,
				columnIndex: column2Index,
			},
		],
		subQueries: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertFieldNodes(fields, tableIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});

test('primitive, o2m', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnIndex = 0;
	const columnAlias = randomIdentifier();
	const keyColumnName = randomIdentifier();
	const keyColumnIndex = 1;

	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalAlias = randomIdentifier();
	const externalColumnName = randomIdentifier();
	const externalColumnAlias = randomIdentifier();
	const externalForeignKeyColumnName = randomIdentifier();

	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: columnName,
			alias: columnAlias,
		},
		{
			type: 'nested-single-many',
			fields: [
				{
					type: 'primitive',
					field: externalColumnName,
					alias: externalColumnAlias,
				},
			],
			alias: externalAlias,
			nesting: {
				type: 'relational-many',

				local: {
					fields: [keyColumnName],
				},
				foreign: {
					store: externalStore,
					collection: externalTableName,
					fields: [externalForeignKeyColumnName],
				},
			},
			modifiers: {},
		},
	];

	const expectedResult: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					tableIndex,
					columnName,
					columnIndex,
				},
				{
					type: 'primitive',
					tableIndex,
					columnName: keyColumnName,
					columnIndex: keyColumnIndex,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: [
			{
				type: 'root',
				alias: columnAlias,
				columnIndex: columnIndex,
			},
			{
				type: 'sub',
				alias: externalAlias,
				index: 0,
			},
		],
		subQueries: [expect.any(Function)],
	};

	const indexGen = createIndexGenerators();
	const result = convertFieldNodes(fields, tableIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});
