import type { AbstractQueryFieldNodeNestedSingleMany } from '@directus/data';
import { randomAlpha, randomIdentifier, randomInteger, randomUUID } from '@directus/random';
import { expect, test } from 'vitest';
import type { ConverterResult } from '../../index.js';
import { getNestedMany, type NestedManyResult } from './create-nested-manys.js';

test('getNestedMany with a single identifier', () => {
	const columnIndexToName = (columnIndex: number) => `c${columnIndex}`;

	const tableIndex = randomInteger(0, 100);
	const keyColumnName = randomIdentifier();
	const keyColumnIndex = 1;
	const keyColumnValue = randomUUID();

	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalTableIndex = 0;
	const externalForeignKeyColumnName = randomIdentifier();
	const externalForeignKeyColumnIndex = 0;
	const externalForeignKeyColumnAlias = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedSingleMany = {
		type: 'nested-single-many',
		fields: [
			{
				type: 'primitive',
				field: externalForeignKeyColumnName,
				alias: externalForeignKeyColumnAlias,
			},
		],
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
		alias: randomIdentifier(),
		modifiers: {},
	};

	const expectedResult: NestedManyResult = {
		subQuery: expect.any(Function),
		select: [
			{
				type: 'primitive',
				tableIndex,
				columnName: keyColumnName,
				columnIndex: keyColumnIndex,
			},
		],
	};

	const rootRow = { [columnIndexToName(keyColumnIndex)]: keyColumnValue };

	const expectedGeneratedQuery: ConverterResult = {
		rootQuery: {
			clauses: {
				select: [
					{
						type: 'primitive',
						tableIndex: externalTableIndex,
						columnName: externalForeignKeyColumnName,
						columnIndex: externalForeignKeyColumnIndex,
					},
				],
				from: {
					tableName: externalTableName,
					tableIndex: externalTableIndex,
				},
				joins: [],
				where: {
					type: 'condition',
					condition: {
						type: 'condition-string',
						operation: 'eq',
						target: {
							type: 'primitive',
							tableIndex: externalTableIndex,
							columnName: externalForeignKeyColumnName,
						},
						compareTo: {
							type: 'value',
							parameterIndex: 0,
						},
					},
					negate: false,
				},
			},
			parameters: [keyColumnValue],
		},
		subQueries: [],
		aliasMapping: [{ type: 'root', alias: externalForeignKeyColumnAlias, columnIndex: externalForeignKeyColumnIndex }],
	};

	const result = getNestedMany(field, tableIndex);

	expect(result).toStrictEqual(expectedResult);
	expect(result.subQuery(rootRow, columnIndexToName)).toStrictEqual(expectedGeneratedQuery);
});

test('getNestedMany with a multiple identifiers (a composite key)', () => {
	const columnIndexToName = (columnIndex: number) => `c${columnIndex}`;

	const tableIndex = randomInteger(0, 100);
	const keyColumn1Name = randomIdentifier();
	const keyColumn1Index = 1;
	const keyColumn1Value = randomUUID();
	const keyColumn2Name = randomIdentifier();
	const keyColumn2Index = 2;
	const keyColumn2Value = randomUUID();

	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalTableIndex = 0;
	const externalColumnName = randomIdentifier();
	const externalColumnIndex = 0;
	const externalColumnAlias = randomIdentifier();
	const externalForeignKeyColumn1Name = randomIdentifier();
	const externalForeignKeyColumn2Name = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedSingleMany = {
		type: 'nested-single-many',
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
				fields: [keyColumn1Name, keyColumn2Name],
			},
			foreign: {
				store: externalStore,
				collection: externalTableName,
				fields: [externalForeignKeyColumn1Name, externalForeignKeyColumn2Name],
			},
		},
		modifiers: {},
		alias: randomIdentifier(),
	};

	const expectedResult: NestedManyResult = {
		subQuery: expect.any(Function),
		select: [
			{
				type: 'primitive',
				tableIndex,
				columnName: keyColumn1Name,
				columnIndex: keyColumn1Index,
			},
			{
				type: 'primitive',
				tableIndex,
				columnName: keyColumn2Name,
				columnIndex: keyColumn2Index,
			},
		],
	};

	const rootRow = {
		[columnIndexToName(keyColumn1Index)]: keyColumn1Value,
		[columnIndexToName(keyColumn2Index)]: keyColumn2Value,
	};

	const expectedGeneratedQuery: ConverterResult = {
		rootQuery: {
			clauses: {
				select: [
					{
						type: 'primitive',
						tableIndex: externalTableIndex,
						columnName: externalColumnName,
						columnIndex: externalColumnIndex,
					},
				],
				from: {
					tableName: externalTableName,
					tableIndex: externalTableIndex,
				},
				joins: [],
				where: {
					type: 'logical',
					operator: 'and',
					negate: false,
					childNodes: [
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'eq',
								target: {
									type: 'primitive',
									tableIndex: externalTableIndex,
									columnName: externalForeignKeyColumn1Name,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 0,
								},
							},
							negate: false,
						},
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'eq',
								target: {
									type: 'primitive',
									tableIndex: externalTableIndex,
									columnName: externalForeignKeyColumn2Name,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 1,
								},
							},
							negate: false,
						},
					],
				},
			},
			parameters: [keyColumn1Value, keyColumn2Value],
		},
		subQueries: [],
		aliasMapping: [{ type: 'root', alias: externalColumnAlias, columnIndex: externalColumnIndex }],
	};

	const result = getNestedMany(field, tableIndex);

	expect(result).toStrictEqual(expectedResult);
	expect(result.subQuery(rootRow, columnIndexToName)).toStrictEqual(expectedGeneratedQuery);
});

test('getNestedMany with modifiers', () => {
	const columnIndexToName = (columnIndex: number) => `c${columnIndex}`;

	const tableIndex = randomInteger(0, 100);
	const keyColumnName = randomIdentifier();
	const keyColumnIndex = 1;
	const keyColumnValue = randomUUID();

	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalTableIndex = 0;
	const externalForeignKeyColumnName = randomIdentifier();
	const externalForeignKeyColumnIndex = 0;
	const externalForeignKeyColumnAlias = randomIdentifier();
	const externalForeignKeyColumnValue = randomUUID();

	const limit = randomInteger(1, 100);

	const field: AbstractQueryFieldNodeNestedSingleMany = {
		type: 'nested-single-many',
		fields: [
			{
				type: 'primitive',
				field: externalForeignKeyColumnName,
				alias: externalForeignKeyColumnAlias,
			},
		],
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
		modifiers: {
			filter: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					operation: 'starts_with',
					target: {
						type: 'primitive',
						field: externalForeignKeyColumnName,
					},
					compareTo: externalForeignKeyColumnValue,
				},
			},
			limit: {
				type: 'limit',
				value: limit,
			},
			sort: [
				{
					type: 'sort',
					direction: 'ascending',
					target: {
						type: 'primitive',
						field: externalForeignKeyColumnName,
					},
				},
			],
		},
		alias: randomIdentifier(),
	};

	const expectedResult: NestedManyResult = {
		subQuery: expect.any(Function),
		select: [
			{
				type: 'primitive',
				tableIndex,
				columnName: keyColumnName,
				columnIndex: keyColumnIndex,
			},
		],
	};

	const rootRow = {
		[columnIndexToName(keyColumnIndex)]: keyColumnValue,
		[columnIndexToName(externalForeignKeyColumnIndex)]: externalForeignKeyColumnValue,
	};

	const expectedGeneratedQuery: ConverterResult = {
		rootQuery: {
			clauses: {
				select: [
					{
						type: 'primitive',
						tableIndex: externalTableIndex,
						columnName: externalForeignKeyColumnName,
						columnIndex: externalForeignKeyColumnIndex,
					},
				],
				from: {
					tableName: externalTableName,
					tableIndex: externalTableIndex,
				},
				joins: [],
				where: {
					type: 'logical',
					operator: 'and',
					negate: false,
					childNodes: [
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'starts_with',
								target: {
									type: 'primitive',
									tableIndex: externalTableIndex,
									columnName: externalForeignKeyColumnName,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 0,
								},
							},
							negate: false,
						},
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'eq',
								target: {
									type: 'primitive',
									tableIndex: externalTableIndex,
									columnName: externalForeignKeyColumnName,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 2,
								},
							},
							negate: false,
						},
					],
				},
				limit: {
					type: 'value',
					parameterIndex: 1,
				},
				order: [
					{
						type: 'order',
						orderBy: {
							type: 'primitive',
							tableIndex: externalTableIndex,
							columnName: externalForeignKeyColumnName,
						},
						direction: 'ASC',
					},
				],
			},

			parameters: [externalForeignKeyColumnValue, limit, keyColumnValue],
		},
		subQueries: [],
		aliasMapping: [{ type: 'root', alias: externalForeignKeyColumnAlias, columnIndex: externalForeignKeyColumnIndex }],
	};

	const result = getNestedMany(field, tableIndex);

	expect(result).toStrictEqual(expectedResult);
	expect(result.subQuery(rootRow, columnIndexToName)).toStrictEqual(expectedGeneratedQuery);
});

test('getNestedMany with nested modifiers', () => {
	const columnIndexToName = (columnIndex: number) => `c${columnIndex}`;

	const tableIndex = randomInteger(0, 100);
	const keyColumnName = randomIdentifier();
	const keyColumnIndex = 1;
	const keyColumnValue = randomUUID();

	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalTableIndex = 0;
	const externalColumnName = randomIdentifier();
	const externalColumnIndex = 0;
	const externalColumnAlias = randomIdentifier();
	const externalForeignKeyColumnName = randomIdentifier();
	const externalNestedForeignKeyColumnName = randomIdentifier();

	const nestedStore = randomIdentifier();
	const nestedTableName = randomIdentifier();
	const nestedTableIndex = 1;
	const nestedColumnName = randomIdentifier();
	const nestedColumnValue = randomAlpha(10);
	const nestedKeyColumnName = randomIdentifier();

	const limit = randomInteger(1, 100);

	const field: AbstractQueryFieldNodeNestedSingleMany = {
		type: 'nested-single-many',
		fields: [
			{
				type: 'primitive',
				field: externalColumnName,
				alias: externalColumnAlias,
			},
		],
		alias: randomIdentifier(),
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
		modifiers: {
			filter: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					operation: 'starts_with',
					target: {
						type: 'nested-one-target',
						field: {
							type: 'primitive',
							field: nestedColumnName,
						},
						nesting: {
							type: 'relational-many',
							local: {
								fields: [externalNestedForeignKeyColumnName],
							},
							foreign: {
								store: nestedStore,
								collection: nestedTableName,
								fields: [nestedKeyColumnName],
							},
						},
					},
					compareTo: nestedColumnValue,
				},
			},
			limit: {
				type: 'limit',
				value: limit,
			},
		},
	};

	const expectedResult: NestedManyResult = {
		subQuery: expect.any(Function),
		select: [
			{
				type: 'primitive',
				tableIndex,
				columnName: keyColumnName,
				columnIndex: keyColumnIndex,
			},
		],
	};

	const expectedGeneratedQuery: ConverterResult = {
		rootQuery: {
			clauses: {
				select: [
					{
						type: 'primitive',
						tableIndex: externalTableIndex,
						columnName: externalColumnName,
						columnIndex: externalColumnIndex,
					},
				],
				from: {
					tableName: externalTableName,
					tableIndex: externalTableIndex,
				},
				joins: [
					{
						type: 'join',
						tableName: nestedTableName,
						tableIndex: nestedTableIndex,
						on: {
							type: 'condition',
							condition: {
								type: 'condition-field',
								compareTo: {
									type: 'primitive',
									tableIndex: nestedTableIndex,
									columnName: nestedKeyColumnName,
								},
								operation: 'eq',
								target: {
									type: 'primitive',
									tableIndex: externalTableIndex,
									columnName: externalNestedForeignKeyColumnName,
								},
							},
							negate: false,
						},
					},
				],
				where: {
					type: 'logical',
					operator: 'and',
					negate: false,
					childNodes: [
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'starts_with',
								target: {
									type: 'primitive',
									tableIndex: nestedTableIndex,
									columnName: nestedColumnName,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 0,
								},
							},
							negate: false,
						},
						{
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'eq',
								target: {
									type: 'primitive',
									tableIndex: externalTableIndex,
									columnName: externalForeignKeyColumnName,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 2,
								},
							},
							negate: false,
						},
					],
				},
				limit: {
					type: 'value',
					parameterIndex: 1,
				},
			},
			parameters: [nestedColumnValue, limit, keyColumnValue],
		},
		subQueries: [],
		aliasMapping: [
			{
				type: 'root',
				alias: externalColumnAlias,
				columnIndex: externalColumnIndex,
			},
		],
	};

	const rootResultRow = { [columnIndexToName(keyColumnIndex)]: keyColumnValue };

	const result = getNestedMany(field, tableIndex);

	expect(result).toStrictEqual(expectedResult);
	expect(result.subQuery(rootResultRow, columnIndexToName)).toStrictEqual(expectedGeneratedQuery);
});
