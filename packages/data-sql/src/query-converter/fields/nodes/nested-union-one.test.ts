import type { AbstractQueryFieldNodeNestedUnionRelational } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { getNestedUnionOne, type NestedUnionOneResult } from './nested-union-one.js';
import { createIndexGenerators } from '../../utils/create-index-generators.js';

test('getNestedUnionOne with a single identifier', () => {
	const relationalColumn = randomIdentifier();
	const rootTableIndex = randomInteger(0, 10);
	const foreignIdField = randomIdentifier();
	const foreignDesiredField1 = randomIdentifier();
	const foreignDesiredField2 = randomIdentifier();
	const foreignIdFieldAlias = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();
	const foreignIdField2 = randomIdentifier();
	const foreignIdFieldAlias2 = randomIdentifier();
	const foreignTable2 = randomIdentifier();
	const foreignStore2 = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedUnionRelational = {
		type: 'relational-union',
		field: relationalColumn,
		collections: [
			{
				fields: [
					{
						type: 'primitive',
						field: foreignDesiredField1,
						alias: foreignIdFieldAlias,
					},
				],
				relational: {
					store: foreignStore,
					collectionName: foreignTable,
					collectionIdentifier: randomIdentifier(),
					fields: [
						{
							name: foreignIdField,
							type: 'string',
						},
					],
				},
			},
			{
				fields: [
					{
						type: 'primitive',
						field: foreignDesiredField2,
						alias: foreignIdFieldAlias2,
					},
				],
				relational: {
					store: foreignStore2,
					collectionName: foreignTable2,
					collectionIdentifier: randomIdentifier(),
					fields: [
						{
							name: foreignIdField2,
							type: 'string',
						},
					],
				},
			},
		],
	};

	const indexGenerators = createIndexGenerators();
	const result = getNestedUnionOne(field, rootTableIndex, indexGenerators);

	const expected: NestedUnionOneResult = {
		joins: [
			{
				type: 'join',
				tableIndex: 0,
				tableName: foreignTable,
				on: {
					type: 'logical',
					negate: false,
					operator: 'and',
					childNodes: [
						{
							type: 'condition',
							negate: false,
							condition: {
								type: 'condition-string',
								operation: 'eq',
								target: {
									type: 'json',
									tableIndex: rootTableIndex,
									columnName: relationalColumn,
									path: [0],
								},
								compareTo: {
									type: 'value',
									parameterIndex: 1,
								},
							},
						},
						{
							type: 'condition',
							negate: false,
							condition: {
								type: 'condition-field',
								operation: 'eq',
								target: {
									type: 'json',
									tableIndex: rootTableIndex,
									columnName: relationalColumn,
									path: [2],
								},
								compareTo: {
									type: 'primitive',
									columnName: foreignIdField,
									tableIndex: 0,
								},
							},
						},
					],
				},
			},
			{
				type: 'join',
				tableIndex: 1,
				tableName: foreignTable2,
				on: {
					type: 'logical',
					negate: false,
					operator: 'and',
					childNodes: [
						{
							type: 'condition',
							negate: false,
							condition: {
								type: 'condition-string',
								operation: 'eq',
								target: {
									type: 'json',
									tableIndex: rootTableIndex,
									columnName: relationalColumn,
									path: [3],
								},
								compareTo: {
									type: 'value',
									parameterIndex: 4,
								},
							},
						},
						{
							type: 'condition',
							negate: false,
							condition: {
								type: 'condition-field',
								operation: 'eq',
								target: {
									type: 'json',
									tableIndex: rootTableIndex,
									columnName: relationalColumn,
									path: [5],
								},
								compareTo: {
									type: 'primitive',
									columnName: foreignIdField2,
									tableIndex: 1,
								},
							},
						},
					],
				},
			},
		],
		selects: [
			{
				type: 'primitive',
				tableIndex: rootTableIndex,
				columnName: relationalColumn,
				columnIndex: 0,
			},
			{
				type: 'primitive',
				tableIndex: 0,
				columnName: foreignDesiredField1,
				columnIndex: 1,
			},
			{
				type: 'primitive',
				tableIndex: 1,
				columnName: foreignDesiredField2,
				columnIndex: 2,
			},
		],
		aliasMapping: [
			{
				type: 'root',
				alias: relationalColumn,
				columnIndex: 0,
			},
			{
				type: 'nested',
				alias: foreignTable,
				children: [
					{
						type: 'root',
						alias: foreignIdFieldAlias,
						columnIndex: 1,
					},
				],
			},
			{
				type: 'nested',
				alias: foreignTable2,
				children: [
					{
						type: 'root',
						alias: foreignIdFieldAlias2,
						columnIndex: 2,
					},
				],
			},
		],
		parameters: ['foreignCollection', foreignTable, 'foreignKey', 'foreignCollection', foreignTable2, 'foreignKey'],
	};

	expect(result).toStrictEqual(expected);
});