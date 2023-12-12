import type { AbstractQueryFieldNodeNestedUnionOne } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { afterAll, expect, test, vi } from 'vitest';
import type { ConverterResult } from '../../index.js';
import { type NestedManyResult } from './create-nested-manys.js';
import { getNestedUnionOne } from './create-nested-union-one.js';

afterAll(() => {
	vi.restoreAllMocks();
});

vi.mock('../../utils/create-unique-alias.js', () => ({
	createUniqueAlias: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

test('getNestedUnionOne with a single identifier', () => {
	const collection = randomIdentifier();
	const localIdField = randomIdentifier();
	const relationalColumn = randomIdentifier();

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

	const randomValue = randomIdentifier();
	const manyAlias = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedUnionOne = {
		type: 'nested-union-one',
		alias: manyAlias,
		nesting: {
			type: 'relational-any',
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
						collectionIdentifier: 'uuid',
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
						collectionIdentifier: 'uuid2',
						identifierFields: [foreignIdField2],
					},
				},
			],
		},
	};

	const result = getNestedUnionOne(collection, field);

	const expected: NestedManyResult = {
		subQuery: expect.any(Function),
		select: [
			{
				type: 'primitive',
				table: collection,
				column: relationalColumn,
				as: `${relationalColumn}_RANDOM`,
			},
		],
	};

	const rootRow = {
		[`${localIdField}_RANDOM`]: randomValue,
		[`${relationalColumn}_RANDOM`]: {
			foreignKey: [1],
			foreignCollection: foreignTable2,
		},
	};

	const expectedGeneratedQuery: ConverterResult = {
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
			parameters: [1],
		},
		subQueries: [],
		aliasMapping: [{ type: 'root', alias: foreignIdFieldAlias2, column: `${foreignIdField2}_RANDOM` }],
	};

	expect(result).toStrictEqual(expected);
	expect(result.subQuery(rootRow)).toStrictEqual(expectedGeneratedQuery);
});
