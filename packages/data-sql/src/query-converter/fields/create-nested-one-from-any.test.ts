import type { AbstractQueryFieldNodeNestedUnionOne } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { afterAll, expect, test, vi } from 'vitest';
import type { A2ORelation, AbstractSqlNestedOneFromAny, AbstractSqlQuery } from '../../index.js';
import { getNestedOneFromAny } from './create-nested-one-from-any.js';

afterAll(() => {
	vi.restoreAllMocks();
});

vi.mock('../../orm/create-unique-alias.js', () => ({
	createUniqueAlias: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

test.todo('getNestedOne with a single identifier', () => {
	const desiredForeignField = randomIdentifier();
	const foreignIdFieldAlias = randomIdentifier();
	const randomPkValue = randomIdentifier();
	const manyAlias = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedUnionOne = {
		type: 'nested-union-one',
		alias: manyAlias,
		nesting: {
			type: 'relational-any',
			field: randomIdentifier(),
			collections: [
				{
					fields: [
						{
							type: 'primitive',
							field: desiredForeignField,
							alias: foreignIdFieldAlias,
						},
					],
					relational: {
						store: randomIdentifier(),
						collectionName: randomIdentifier(),
						collectionIdentifier: randomIdentifier(),
						field: [randomIdentifier()],
					},
				},
			],
		},
	};

	const result = getNestedOneFromAny(field);

	const expected: AbstractSqlNestedOneFromAny = {
		queryGenerator: expect.any(Function),
		alias: field.alias,
	};

	expect(result).toStrictEqual(expected);

	// the dynamic data stored in the database
	const a2ORelation: A2ORelation = {
		foreignKey: [randomPkValue],
		table: randomIdentifier(),
	};

	const actualGeneratedQuery = result.queryGenerator(a2ORelation);

	const expectedGeneratedQuery: AbstractSqlQuery = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: a2ORelation.table,
					column: desiredForeignField,
					as: `${desiredForeignField}_RANDOM`,
				},
			],
			from: a2ORelation.table,
			joins: [],
			where: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					operation: 'eq',
					target: {
						type: 'primitive',
						table: a2ORelation.table,
						column: field.nesting.collections[0]!.relational.field[0]!,
					},
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
				negate: false,
			},
		},
		parameters: [a2ORelation.foreignKey[0]],
		aliasMapping: new Map([[`${desiredForeignField}_RANDOM`, [foreignIdFieldAlias]]]),
		nestedManys: [],
	};

	expect(actualGeneratedQuery).toStrictEqual(expectedGeneratedQuery);
});
