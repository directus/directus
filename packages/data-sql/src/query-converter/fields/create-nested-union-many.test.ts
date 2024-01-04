import type { A2ORelation, AbstractQueryFieldNodeNestedUnionMany } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { afterAll, expect, test, vi } from 'vitest';
import type { ConverterResult } from '../../index.js';
import { getNestedUnionMany, type NestedUnionResult } from './create-nested-union-many.js';

afterAll(() => {
	vi.restoreAllMocks();
});

vi.mock('../../utils/create-unique-alias.js', () => ({
	createUniqueAlias: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

test.todo('getNestedUnionMany', () => {
	const collection = randomIdentifier();
	const localDesiredField = randomIdentifier();
	const localIdField = randomIdentifier();

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
	const foreignTable2 = randomIdentifier();
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
						collectionName: foreignTable2,
						collectionIdentifier: randomIdentifier(),
						identifierFields: [foreignIdField2],
					},
				},
			],
		},
	};

	const result = getNestedUnionMany(collection, field);

	const expected: NestedUnionResult = {
		subQueries: expect.any(Function),
		select: [
			{
				type: 'primitive',
				table: collection,
				column: localIdField,
				as: `${localIdField}_RANDOM`,
			},
		],
	};

	expect(result).toStrictEqual(expected);

	const rootChunkIdValue = randomIdentifier();

	const exampleRootRow = {
		[`${localIdField}_RANDOM`]: rootChunkIdValue,
		[`${localDesiredField}_RANDOM`]: randomIdentifier(),
	};

	const expectedFinalQueries: ConverterResult[] = [
		{
			rootQuery: {
				clauses: {
					select: [
						{
							type: 'primitive',
							table: foreignTable2,
							column: foreignIdField2,
							as: `${foreignIdField2}_RANDOM`,
						},
					],
					from: foreignTable2,
					joins: [],
					where: {
						type: 'condition',
						condition: {
							type: 'condition-string',
							operation: 'eq',
							target: {
								type: 'primitive',
								table: foreignTable2,
								column: foreignIdField2,
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
						foreignCollection: foreignTable2,
					} as A2ORelation),
				],
			},
			subQueries: [],
			aliasMapping: [{ type: 'root', alias: foreignIdFieldAlias2, column: `${foreignIdField2}_RANDOM` }],
		},
		{
			rootQuery: {
				clauses: {
					select: [
						{
							type: 'primitive',
							table: foreignTable2,
							column: foreignIdField2,
							as: `${foreignIdField2}_RANDOM`,
						},
					],
					from: foreignTable2,
					joins: [],
					where: {
						type: 'condition',
						condition: {
							type: 'condition-string',
							operation: 'eq',
							target: {
								type: 'primitive',
								table: foreignTable2,
								column: foreignIdField2,
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
						foreignCollection: foreignTable2,
					} as A2ORelation),
				],
			},
			subQueries: [],
			aliasMapping: [{ type: 'root', alias: foreignIdFieldAlias2, column: `${foreignIdField2}_RANDOM` }],
		},
	];

	if (!result.subQueries) {
		throw new Error('No sub query defined');
	}

	expect(result.subQueries(exampleRootRow)).toStrictEqual(expectedFinalQueries);
});
