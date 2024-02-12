import type { AbstractQueryFieldNode } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../utils/create-index-generators.js';
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
		currentJsonPath: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertFieldNodes(fields, tableIndex, indexGen, [], null, false, false);
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
		currentJsonPath: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertFieldNodes(fields, tableIndex, indexGen, [], null, false, false);
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
				type: 'relational-single',

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
		currentJsonPath: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertFieldNodes(fields, tableIndex, indexGen, [], null, false, false);
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
				type: 'relational-single',

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
		currentJsonPath: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertFieldNodes(fields, tableIndex, indexGen, [], null, false, false);
	expect(result).toStrictEqual(expectedResult);
});

test('primitive, json path', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnAlias = randomIdentifier();
	const jsonColumnName = randomIdentifier();
	const attribute1 = randomIdentifier();
	const attribute1Alias = randomIdentifier();
	const attribute2 = randomIdentifier();
	const attribute2Alias = randomIdentifier();
	const attribute3 = randomIdentifier();
	const attribute3Alias = randomIdentifier();
	const attribute4 = randomIdentifier();
	const attribute4Alias = randomIdentifier();
	const attribute5 = randomIdentifier();
	const attribute5Alias = randomIdentifier();
	const jsonValueAlias = randomIdentifier();

	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: columnName,
			alias: columnAlias,
		},
		{
			type: 'nested-single-one',
			nesting: {
				type: 'object-single',
				fieldName: jsonColumnName,
			},
			fields: [
				{
					type: 'primitive',
					field: attribute1,
					alias: attribute1Alias,
				},
				{
					type: 'nested-single-one',
					nesting: {
						type: 'object-single',
						fieldName: attribute2,
					},
					fields: [
						{
							type: 'primitive',
							field: attribute3,
							alias: attribute3Alias,
						},
						{
							type: 'nested-single-one',
							nesting: {
								type: 'object-single',
								fieldName: attribute4,
							},
							fields: [
								{
									type: 'primitive',
									field: attribute5,
									alias: attribute5Alias,
								},
							],
							alias: attribute4Alias,
						},
					],
					alias: attribute2Alias,
				},
			],
			alias: jsonValueAlias,
		},
	];

	const expectedResult: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					tableIndex,
					columnName: columnName,
					columnIndex: 0,
				},
				{
					type: 'json',
					tableIndex,
					columnName: jsonColumnName,
					path: [0],
					columnIndex: 1,
				},
				{
					type: 'json',
					tableIndex,
					columnName: jsonColumnName,
					path: [1, 2],
					columnIndex: 2,
				},
				{
					type: 'json',
					tableIndex,
					columnName: jsonColumnName,
					path: [3, 4, 5],
					columnIndex: 3,
				},
			],
			joins: [],
		},
		parameters: [attribute1, attribute2, attribute3, attribute2, attribute4, attribute5],
		aliasMapping: [
			{
				type: 'root',
				alias: columnAlias,
				columnIndex: 0,
			},
			{
				type: 'nested',
				alias: jsonValueAlias,
				children: [
					{
						type: 'root',
						alias: attribute1Alias,
						columnIndex: 1,
					},
					{
						type: 'nested',
						alias: attribute2Alias,
						children: [
							{
								type: 'root',
								alias: attribute3Alias,
								columnIndex: 2,
							},
							{
								type: 'nested',
								alias: attribute4Alias,
								children: [
									{
										type: 'root',
										alias: attribute5Alias,
										columnIndex: 3,
									},
								],
							},
						],
					},
				],
			},
		],
		subQueries: [],
		currentJsonPath: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertFieldNodes(fields, tableIndex, indexGen, [], null, false, false);
	expect(result).toStrictEqual(expectedResult);
});
