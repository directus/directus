import type { AbstractQueryFieldNodeNestedUnionOne } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { expect, test } from 'vitest';
import type { ConverterResult } from '../../index.js';
import { type NestedManyResult } from './nodes/nested-manys.js';
import { getNestedUnionOne } from './create-nested-union-one.js';
import { createIndexGenerators } from '../utils/create-index-generators.js';

test('getNestedUnionOne with a single identifier', () => {
	const relationalColumn = randomIdentifier();
	const tableIndex = 0;

	// first foreign collection
	const foreignIdField = randomIdentifier();
	const foreignIdFieldAlias = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();

	// second foreign collection
	const foreignIdField2 = randomIdentifier();
	const foreignIdFieldAlias2 = randomIdentifier();
	const foreignTable2 = randomIdentifier();
	const foreignStore2 = randomIdentifier();

	const manyAlias = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedUnionOne = {
		type: 'nested-union-one',
		alias: manyAlias,
		nesting: {
			type: 'relational-union',
			field: relationalColumn,
			collections: [
				{
					fields: [
						{
							type: 'primitive',
							field: foreignIdField,
							alias: foreignIdFieldAlias,
						},
					],
					relational: {
						store: foreignStore,
						collectionName: foreignTable,
						collectionIdentifier: randomIdentifier(),
						identifierFields: [foreignIdField],
					},
				},
				{
					fields: [
						{
							type: 'primitive',
							field: foreignIdField2,
							alias: foreignIdFieldAlias2,
						},
					],
					relational: {
						store: foreignStore2,
						collectionName: foreignTable2,
						collectionIdentifier: randomIdentifier(),
						identifierFields: [foreignIdField2],
					},
				},
			],
		},
	};

	const indexGenerators = createIndexGenerators();

	const result = getNestedUnionOne(field, tableIndex, indexGenerators);

	const expected: NestedManyResult = {
		subQuery: expect.any(Function),
		select: [
			{
				type: 'primitive',
				tableIndex,
				columnName: relationalColumn,
				columnIndex: 0,
			},
		],
	};

	expect(result).toStrictEqual(expected);

	const jsonValue = {
		foreignKey: [
			{
				column: foreignIdField2,
				value: 1,
			},
		],
		foreignCollection: foreignTable2,
	};

	const exampleRootRow = {
		c0: JSON.stringify(jsonValue),
	};

	const expectedGeneratedQuery: ConverterResult = {
		rootQuery: {
			clauses: {
				select: [
					{
						type: 'primitive',
						tableIndex,
						columnName: foreignIdField2,
						columnIndex: 0,
					},
				],
				from: {
					tableName: foreignTable2,
					tableIndex,
				},
				joins: [],
				where: {
					type: 'condition',
					condition: {
						type: 'condition-string',
						operation: 'eq',
						target: {
							type: 'primitive',
							tableIndex,
							columnName: foreignIdField2,
						},
						compareTo: {
							type: 'value',
							parameterIndex: 0,
						},
					},
					negate: false,
				},
			},
			parameters: [1],
		},
		subQueries: [],
		aliasMapping: [{ type: 'root', alias: foreignIdFieldAlias2, columnIndex: 0 }],
	};

	expect(result.subQuery(exampleRootRow, (columnIndex: number) => `c${columnIndex}`)).toStrictEqual(
		expectedGeneratedQuery,
	);
});
