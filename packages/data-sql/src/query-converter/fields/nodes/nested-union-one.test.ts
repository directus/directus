import type { AbstractQueryFieldNodeNestedUnionRelational } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { expect, test } from 'vitest';
import { getNestedUnionOne, type NestedUnionOneResult } from './nested-union-one.js';
import { createIndexGenerators } from '../../utils/create-index-generators.js';

test('getNestedUnionOne with a single identifier', () => {
	const relationalColumn = randomIdentifier();
	const tableIndex = 0;
	const foreignIdField = randomIdentifier();
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
						field: foreignIdField,
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
						field: foreignIdField2,
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
	const result = getNestedUnionOne(field, tableIndex, indexGenerators);

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
									tableIndex: 0,
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
									tableIndex: 0,
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
									tableIndex: 1,
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
									tableIndex: 0,
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
		select: {
			type: 'primitive',
			tableIndex,
			columnName: relationalColumn,
			columnIndex: 0,
		},
		aliasMapping: [
			{
				type: 'root',
				alias: relationalColumn,
				columnIndex: 0,
			},
		],
		parameters: ['foreignCollection', foreignTable, 'foreignKey', 'foreignCollection', foreignTable2, 'foreignKey'],
	};

	expect(result).toStrictEqual(expected);
});
