import type { AbstractQueryFieldNodeNestedUnionMany } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import type { AliasMapping, ConverterResult } from '../../../index.js';
import { getNestedUnionMany, type NestedUnionResult } from './nested-union-many.js';
import { numberGenerator } from '../../utils/number-generator.js';

test('getNestedUnionMany', () => {
	const localIdField = randomIdentifier();
	const rootCollectionIndex = randomInteger(0, 100);

	// first foreign collection
	const foreignField = randomIdentifier();
	const foreignFieldAlias = randomIdentifier();
	const foreignIdField = randomIdentifier();
	const foreignTable1Name = randomIdentifier();
	const foreignRelationalField1 = randomIdentifier();
	const foreignTable1Index = randomInteger(0, 100);

	// second foreign collection
	const foreignField2 = randomIdentifier();
	const foreignField2Alias = randomIdentifier();
	const foreignIdField2 = randomIdentifier();
	const foreignIdFieldAlias2 = randomIdentifier();
	const foreignTable2Name = randomIdentifier();
	const foreignTable2Index = randomInteger(0, 100);
	const foreignRelationalField2 = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedUnionMany = {
		type: 'nested-union-many',
		alias: foreignTable1Name,
		modifiers: {},
		nesting: {
			type: 'relational-unions',
			identifierFields: [localIdField],
			collections: [
				{
					fields: [
						{
							type: 'primitive',
							field: foreignField,
							alias: foreignFieldAlias,
						},
					],
					relational: {
						store: randomIdentifier(),
						fields: [{ name: foreignIdField, type: 'string' }],
						collectionName: foreignTable1Name,
						collectionIdentifier: randomIdentifier(),
						relationalField: foreignRelationalField1,
					},
				},
				{
					fields: [
						{
							type: 'primitive',
							field: foreignField2,
							alias: foreignField2Alias,
						},
					],
					relational: {
						store: randomIdentifier(),
						collectionName: foreignTable2Name,
						collectionIdentifier: randomIdentifier(),
						fields: [{ name: foreignIdField2, type: 'string' }],
						relationalField: foreignRelationalField2,
					},
				},
			],
		},
	};

	const columnIndexGen = numberGenerator();
	columnIndexGen.next();

	const rootAliasMapping: AliasMapping = [
		{
			type: 'root',
			columnIndex: 1,
			alias: localIdField,
		},
	];

	const result = getNestedUnionMany(field, rootCollectionIndex, columnIndexGen, rootAliasMapping);

	const expected: NestedUnionResult = {
		subQueries: expect.any(Function),
		selects: [
			{
				type: 'primitive',
				tableIndex: rootCollectionIndex,
				columnName: localIdField,
				columnIndex: 1,
			},
		],
	};

	expect(result).toStrictEqual(expected);

	const rootIdValue = randomIdentifier();

	const exampleRootRow = {
		c0: randomIdentifier(), // some desired field
		c1: rootIdValue, // the primary key value which got automatically selected
	};

	const expectedFinalQueries: ConverterResult[] = [
		{
			rootQuery: {
				clauses: {
					select: [
						{
							type: 'primitive',
							tableIndex: 0,
							columnName: foreignField,
							columnIndex: 0,
						},
					],
					from: {
						tableName: foreignTable1Name,
						tableIndex: 0,
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
										type: 'json',
										tableIndex: 0,
										columnName: foreignRelationalField1,
										path: [0],
									},
									compareTo: {
										type: 'value',
										parameterIndex: 1,
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
										type: 'json',
										tableIndex: 0,
										columnName: foreignRelationalField1,
										path: [2, 0],
										pathIsIndex: true,
									},
									compareTo: {
										type: 'value',
										parameterIndex: 3,
									},
								},
								negate: false,
							},
						],
					},
				},
				parameters: ['foreignCollection', foreignTable1Name, 'foreignKey', rootIdValue],
			},
			subQueries: [],
			aliasMapping: [{ type: 'root', alias: foreignIdFieldAlias2, columnIndex: 0 }],
		},
		{
			rootQuery: {
				clauses: {
					select: [
						{
							type: 'primitive',
							tableIndex: 0,
							columnName: foreignField2,
							columnIndex: 0,
						},
					],
					from: {
						tableName: foreignTable2Name,
						tableIndex: 0,
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
										type: 'json',
										tableIndex: 0,
										columnName: foreignRelationalField2,
										path: [0],
									},
									compareTo: {
										type: 'value',
										parameterIndex: 1,
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
										type: 'json',
										tableIndex: 0,
										columnName: foreignRelationalField2,
										path: [2, 0],
										pathIsIndex: true,
									},
									compareTo: {
										type: 'value',
										parameterIndex: 3,
									},
								},
								negate: false,
							},
						],
					},
				},
				parameters: ['foreignCollection', foreignTable2Name, 'foreignKey', rootIdValue],
			},
			subQueries: [],
			aliasMapping: [{ type: 'root', alias: foreignIdFieldAlias2, columnIndex: 0 }],
		},
	];

	if (!result.subQueries) {
		throw new Error('No sub query defined');
	}

	const aliasingFunction = (columnIndex: number) => `c${columnIndex}`;
	expect(result.subQueries(exampleRootRow, aliasingFunction)).toStrictEqual(expectedFinalQueries);
});
