import type { AbstractQuery } from '@directus/data';
import { randomAlpha, randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import type { AbstractSqlQuery } from '../types/index.js';
import { convertQuery } from './converter.js';

test('Convert simple query', () => {
	const store = randomIdentifier();
	const tableName = randomIdentifier();
	const tableIndex = 0;
	const column1Name = randomIdentifier();
	const column1Index = 0;
	const column2Name = randomIdentifier();
	const column2Index = 1;

	const query: AbstractQuery = {
		store,
		collection: tableName,
		fields: [
			{
				type: 'primitive',
				field: column1Name,
				alias: randomIdentifier(),
			},
			{
				type: 'primitive',
				field: column2Name,
				alias: randomIdentifier(),
			},
		],
		modifiers: {},
	};

	const expectedResult: AbstractSqlQuery = {
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
			from: {
				tableName,
				tableIndex,
			},
			joins: [],
		},
		parameters: [],
	};

	const result = convertQuery(query);

	expect(result.rootQuery).toStrictEqual(expectedResult);
});

test('Convert a query with a function as field select', () => {
	const store = randomIdentifier();
	const tableName = randomIdentifier();
	const tableIndex = 0;
	const column1Name = randomIdentifier();
	const column1Index = 0;
	const column2Name = randomIdentifier();
	const column2Index = 1;
	const column3Name = randomIdentifier();
	const column3Index = 2;

	const query: AbstractQuery = {
		store,
		collection: tableName,
		fields: [
			{
				type: 'primitive',
				field: column1Name,
				alias: randomIdentifier(),
			},
			{
				type: 'primitive',
				field: column2Name,
				alias: randomIdentifier(),
			},
			{
				type: 'fn',
				fn: {
					type: 'arrayFn',
					fn: 'count',
				},
				field: column3Name,
				alias: randomIdentifier(),
			},
		],
		modifiers: {},
	};

	const expectedResult: AbstractSqlQuery = {
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
				{
					type: 'fn',
					fn: {
						type: 'arrayFn',
						fn: 'count',
					},
					tableIndex,
					columnName: column3Name,
					columnIndex: column3Index,
				},
			],
			from: {
				tableName,
				tableIndex,
			},
			joins: [],
		},
		parameters: [],
	};

	const result = convertQuery(query);

	expect(result.rootQuery).toStrictEqual(expectedResult);
});

test('Convert query with filter', () => {
	const store = randomIdentifier();
	const tableName = randomIdentifier();
	const tableIndex = 0;
	const column1Name = randomIdentifier();
	const column1Index = 0;
	const column2Name = randomIdentifier();
	const column2Index = 1;
	const column3Name = randomIdentifier();
	const column3Value = randomInteger(1, 100);

	const query: AbstractQuery = {
		store,
		collection: tableName,
		fields: [
			{
				type: 'primitive',
				field: column1Name,
				alias: randomIdentifier(),
			},
			{
				type: 'primitive',
				field: column2Name,
				alias: randomIdentifier(),
			},
		],
		modifiers: {
			filter: {
				type: 'condition',
				condition: {
					type: 'condition-number',
					target: {
						type: 'primitive',
						field: column3Name,
					},
					operation: 'gt',
					compareTo: column3Value,
				},
			},
		},
	};

	const expectedResult: AbstractSqlQuery = {
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
			from: {
				tableName,
				tableIndex,
			},
			joins: [],
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-number',
					target: {
						type: 'primitive',
						tableIndex,
						columnName: column3Name,
					},
					operation: 'gt',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
		},
		parameters: [column3Value],
	};

	const result = convertQuery(query);

	expect(result.rootQuery).toStrictEqual(expectedResult);
});

test('Convert query with a limit', () => {
	const store = randomIdentifier();
	const tableName = randomIdentifier();
	const tableIndex = 0;
	const column1Name = randomIdentifier();
	const column1Index = 0;
	const column2Name = randomIdentifier();
	const column2Index = 1;

	const limit = randomInteger(1, 100);

	const query: AbstractQuery = {
		store,
		collection: tableName,
		fields: [
			{
				type: 'primitive',
				field: column1Name,
				alias: randomIdentifier(),
			},
			{
				type: 'primitive',
				field: column2Name,
				alias: randomIdentifier(),
			},
		],
		modifiers: {
			limit: {
				type: 'limit',
				value: limit,
			},
		},
	};

	const expectedResult: AbstractSqlQuery = {
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
			from: {
				tableName,
				tableIndex,
			},
			joins: [],
			limit: {
				type: 'value',
				parameterIndex: 0,
			},
		},
		parameters: [limit],
	};

	const result = convertQuery(query);

	expect(result.rootQuery).toStrictEqual(expectedResult);
});

test('Convert query with offset', () => {
	const store = randomIdentifier();
	const tableName = randomIdentifier();
	const tableIndex = 0;
	const column1Name = randomIdentifier();
	const column1Index = 0;
	const column2Name = randomIdentifier();
	const column2Index = 1;

	const offset = randomInteger(1, 100);

	const query: AbstractQuery = {
		store,
		collection: tableName,
		fields: [
			{
				type: 'primitive',
				field: column1Name,
				alias: randomIdentifier(),
			},
			{
				type: 'primitive',
				field: column2Name,
				alias: randomIdentifier(),
			},
		],
		modifiers: {
			offset: {
				type: 'offset',
				value: offset,
			},
		},
	};

	const expectedResult: AbstractSqlQuery = {
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
			from: {
				tableName,
				tableIndex,
			},
			joins: [],
			offset: {
				type: 'value',
				parameterIndex: 0,
			},
		},
		parameters: [offset],
	};

	const result = convertQuery(query);

	expect(result.rootQuery).toStrictEqual(expectedResult);
});

test('Convert query with a sort', () => {
	const store = randomIdentifier();
	const tableName = randomIdentifier();
	const tableIndex = 0;
	const column1Name = randomIdentifier();
	const column1Index = 0;
	const column2Name = randomIdentifier();
	const column2Index = 1;
	const column3Name = randomIdentifier();

	const query: AbstractQuery = {
		store,
		collection: tableName,
		fields: [
			{
				type: 'primitive',
				field: column1Name,
				alias: randomIdentifier(),
			},
			{
				type: 'primitive',
				field: column2Name,
				alias: randomIdentifier(),
			},
		],
		modifiers: {
			sort: [
				{
					type: 'sort',
					direction: 'ascending',
					target: {
						type: 'primitive',
						field: column3Name,
					},
				},
			],
		},
	};

	const expectedResult: AbstractSqlQuery = {
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
			from: {
				tableName,
				tableIndex,
			},
			joins: [],
			order: [
				{
					type: 'order',
					orderBy: {
						type: 'primitive',
						tableIndex,
						columnName: column3Name,
					},
					direction: 'ASC',
				},
			],
		},
		parameters: [],
	};

	const result = convertQuery(query);

	expect(result.rootQuery).toStrictEqual(expectedResult);
});

test('Convert a query with all possible modifiers', () => {
	const store = randomIdentifier();
	const tableName = randomIdentifier();
	const tableIndex = 0;
	const column1Name = randomIdentifier();
	const column1Index = 0;
	const column2Name = randomIdentifier();
	const column2Index = 1;
	const column3Name = randomIdentifier();

	const limit = randomInteger(1, 100);
	const offset = randomInteger(1, 100);

	const query: AbstractQuery = {
		store: store,
		collection: tableName,
		fields: [
			{
				type: 'primitive',
				field: column1Name,
				alias: randomIdentifier(),
			},
			{
				type: 'primitive',
				field: column2Name,
				alias: randomIdentifier(),
			},
		],
		modifiers: {
			limit: {
				type: 'limit',
				value: limit,
			},
			offset: {
				type: 'offset',
				value: offset,
			},
			sort: [
				{
					type: 'sort',
					direction: 'ascending',
					target: {
						type: 'primitive',
						field: column3Name,
					},
				},
			],
		},
	};

	const expectedResult: AbstractSqlQuery = {
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
			from: {
				tableName,
				tableIndex,
			},
			joins: [],
			limit: {
				type: 'value',
				parameterIndex: 0,
			},
			offset: {
				type: 'value',
				parameterIndex: 1,
			},
			order: [
				{
					type: 'order',
					orderBy: {
						type: 'primitive',
						tableIndex,
						columnName: column3Name,
					},
					direction: 'ASC',
				},
			],
		},
		parameters: [limit, offset],
	};

	const result = convertQuery(query);

	expect(result.rootQuery).toStrictEqual(expectedResult);
});

test('Convert a query with a relational target string filter', () => {
	const store = randomIdentifier();
	const tableName = randomIdentifier();
	const tableIndex = 0;
	const column1Name = randomIdentifier();
	const column1Index = 0;
	const column2Name = randomIdentifier();
	const column2Index = 1;
	const foreignKeyColumnName = randomIdentifier();

	const externalTableName = randomIdentifier();
	const externalTableIndex = 1;
	const externalColumnName = randomIdentifier();
	const externalColumnValue = randomAlpha(10);
	const externalKeyColumnName = randomIdentifier();

	const query: AbstractQuery = {
		store,
		collection: tableName,
		fields: [
			{
				type: 'primitive',
				field: column1Name,
				alias: randomIdentifier(),
			},
			{
				type: 'primitive',
				field: column2Name,
				alias: randomIdentifier(),
			},
		],
		modifiers: {
			filter: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					target: {
						type: 'nested-one-target',
						field: {
							type: 'primitive',
							field: externalColumnName,
						},
						nesting: {
							type: 'relational-many',
							local: {
								fields: [foreignKeyColumnName],
							},
							foreign: {
								store,
								fields: [externalKeyColumnName],
								collection: externalTableName,
							},
						},
					},
					operation: 'starts_with',
					compareTo: externalColumnValue,
				},
			},
		},
	};

	const expectedResult: AbstractSqlQuery = {
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
			from: {
				tableName,
				tableIndex,
			},
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
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					target: {
						type: 'primitive',
						tableIndex: externalTableIndex,
						columnName: externalColumnName,
					},
					operation: 'starts_with',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
		},
		parameters: [externalColumnValue],
	};

	const result = convertQuery(query);

	expect(result.rootQuery).toStrictEqual(expectedResult);
});

test('Convert a query with a nested field and filtering on another nested field', () => {
	const store = randomIdentifier();
	const tableName = randomIdentifier();
	const tableIndex = 0;
	const columnName = randomIdentifier();
	const columnIndex = 0;
	const foreignKeyColumnName = randomIdentifier();

	const externalTableName = randomIdentifier();
	const externalTableIndex1 = 1;
	const externalTableIndex2 = 2;
	const externalColumn1Name = randomIdentifier();
	const externalColumn1Index = 1;
	const externalColumn2Name = randomIdentifier();
	const externalColumn2Value = randomAlpha(10);
	const externalKeyColumnName = randomIdentifier();

	const query: AbstractQuery = {
		store,
		collection: tableName,
		fields: [
			{
				type: 'primitive',
				field: columnName,
				alias: randomIdentifier(),
			},
			{
				type: 'nested-single-one',
				fields: [
					{
						type: 'primitive',
						field: externalColumn1Name,
						alias: randomIdentifier(),
					},
				],
				alias: randomIdentifier(),
				nesting: {
					type: 'relational-many',
					local: {
						fields: [foreignKeyColumnName],
					},
					foreign: {
						store,
						fields: [externalKeyColumnName],
						collection: externalTableName,
					},
				},
			},
		],
		modifiers: {
			filter: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					target: {
						type: 'nested-one-target',
						field: {
							type: 'primitive',
							field: externalColumn2Name,
						},
						nesting: {
							type: 'relational-many',
							local: {
								fields: [foreignKeyColumnName],
							},
							foreign: {
								store,
								fields: [externalKeyColumnName],
								collection: externalTableName,
							},
						},
					},
					operation: 'starts_with',
					compareTo: externalColumn2Value,
				},
			},
		},
	};

	const expectedResult: AbstractSqlQuery = {
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
					tableIndex: externalTableIndex1,
					columnName: externalColumn1Name,
					columnIndex: externalColumn1Index,
				},
			],
			from: {
				tableName,
				tableIndex,
			},
			joins: [
				{
					type: 'join',
					tableName: externalTableName,
					tableIndex: externalTableIndex1,
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
								tableIndex: externalTableIndex1,
								columnName: externalKeyColumnName,
							},
						},
						negate: false,
					},
				},
				{
					type: 'join',
					tableName: externalTableName,
					tableIndex: externalTableIndex2,
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
								tableIndex: externalTableIndex2,
								columnName: externalKeyColumnName,
							},
						},
						negate: false,
					},
				},
			],
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					target: {
						type: 'primitive',
						tableIndex: externalTableIndex2,
						columnName: externalColumn2Name,
					},
					operation: 'starts_with',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
		},
		parameters: [externalColumn2Value],
	};

	const result = convertQuery(query);

	expect(result.rootQuery).toStrictEqual(expectedResult);
});
