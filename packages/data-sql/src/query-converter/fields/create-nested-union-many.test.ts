import type { A2ORelation, AbstractQueryFieldNodeNestedUnionMany } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import type { ConverterResult } from '../../index.js';
import { getNestedUnionMany, type NestedUnionResult } from './create-nested-union-many.js';
import { numberGenerator } from '../utils/number-generator.js';

test('getNestedUnionMany', () => {
	const localIdField = randomIdentifier();
	const rootCollectionIndex = randomInteger(0, 100);

	// first foreign collection
	const foreignField = randomIdentifier();
	const foreignFieldAlias = randomIdentifier();
	const foreignIdField = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignRelationalField1 = randomIdentifier();

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
		alias: foreignTable,
		modifiers: {},
		localIdentifierFields: [localIdField],
		nesting: {
			type: 'relational-anys',
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
						field: foreignRelationalField1,
						collectionName: foreignTable,
						collectionIdentifier: randomIdentifier(),
						identifierFields: [foreignIdField],
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
						field: foreignRelationalField2,
						collectionName: foreignTable2Name,
						collectionIdentifier: randomIdentifier(),
						identifierFields: [foreignIdField2],
					},
				},
			],
		},
	};

	const columnIndexGen = numberGenerator();
	columnIndexGen.next();
	const result = getNestedUnionMany(field, rootCollectionIndex, columnIndexGen);

	const expected: NestedUnionResult = {
		subQueries: expect.any(Function),
		select: [
			{
				type: 'primitive',
				tableIndex: rootCollectionIndex,
				columnName: localIdField,
				columnIndex: 1,
			},
		],
	};

	expect(result).toStrictEqual(expected);

	const rootChunkIdValue = randomIdentifier();

	const exampleRootRow = {
		c0: randomIdentifier(),
		c1: rootChunkIdValue,
	};

	const expectedFinalQueries: ConverterResult[] = [
		{
			rootQuery: {
				clauses: {
					select: [
						{
							type: 'primitive',
							tableIndex: foreignTable2Index,
							columnName: foreignIdField2,
							columnIndex: 0,
						},
					],
					from: {
						tableName: foreignTable2Name,
						tableIndex: foreignTable2Index,
					},
					joins: [],
					where: {
						type: 'condition',
						condition: {
							type: 'condition-string',
							operation: 'eq',
							target: {
								type: 'primitive',
								tableIndex: foreignTable2Index,
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
				parameters: [
					JSON.stringify({
						foreignKey: [
							{
								column: foreignIdField2,
								value: rootChunkIdValue,
							},
						],
						foreignCollection: foreignTable2Name,
					} as A2ORelation),
				],
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
							tableIndex: foreignTable2Index,
							columnName: foreignIdField2,
							columnIndex: 0,
						},
					],
					from: {
						tableName: foreignTable2Name,
						tableIndex: foreignTable2Index,
					},
					joins: [],
					where: {
						type: 'condition',
						condition: {
							type: 'condition-string',
							operation: 'eq',
							target: {
								type: 'primitive',
								tableIndex: foreignTable2Index,
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
				parameters: [
					JSON.stringify({
						foreignKey: [
							{
								column: foreignIdField2,
								value: rootChunkIdValue,
							},
						],
						foreignCollection: foreignTable2Name,
					} as A2ORelation),
				],
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
