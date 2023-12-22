import type { A2ORelation, AbstractQueryFieldNodeNestedUnionMany } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { afterAll, expect, test, vi } from 'vitest';
import type { ConverterResult } from '../../index.js';
import { type NestedManyResult } from './create-nested-manys.js';
import { getNestedUnionMany } from './create-nested-union-many.js';

afterAll(() => {
	vi.restoreAllMocks();
});

vi.mock('../../utils/create-unique-alias.js', () => ({
	createUniqueAlias: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

test.skip('getNestedUnionMany', () => {
	const collection = randomIdentifier();
	const localDesiredField = randomIdentifier();
	const relationalColumn = randomIdentifier();
	const localRelationalField = randomIdentifier();

	// first foreign collection
	const foreignField = randomIdentifier();
	const foreignFieldAlias = randomIdentifier();
	const foreignIdField = randomIdentifier();
	const foreignTable = randomIdentifier();

	// second foreign collection
	const foreignField2 = randomIdentifier();
	const foreignField2Alias = randomIdentifier();
	const foreignIdField2 = randomIdentifier();
	const foreignIdFieldAlias2 = randomIdentifier();
	const foreignTable2 = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedUnionMany = {
		type: 'nested-union-many',
		alias: foreignTable,
		modifiers: {},
		nesting: {
			type: 'relational-any',
			field: localRelationalField,
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
						collectionName: foreignTable2,
						collectionIdentifier: randomIdentifier(),
						identifierFields: [foreignIdField2],
					},
				},
			],
		},
	};

	const result = getNestedUnionMany(collection, field);

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

	expect(result).toStrictEqual(expected);

	const jsonValues: A2ORelation = {
		foreignKey: [
			{
				column: foreignIdField2,
				value: 1,
			},
		],
		foreignCollection: foreignTable2,
	};

	const exampleRootRow = {
		[`${localDesiredField}_RANDOM`]: randomIdentifier(),
		[`${relationalColumn}_RANDOM`]: JSON.stringify(jsonValues),
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
			parameters: [JSON.stringify(jsonValues)],
		},
		subQueries: [],
		aliasMapping: [{ type: 'root', alias: foreignIdFieldAlias2, column: `${foreignIdField2}_RANDOM` }],
	};

	expect(result.subQuery(exampleRootRow)).toStrictEqual(expectedGeneratedQuery);
});
