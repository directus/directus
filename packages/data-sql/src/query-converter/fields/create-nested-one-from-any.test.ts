import type { AbstractQueryFieldNodeNestedOne } from '@directus/data';
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

	const field: AbstractQueryFieldNodeNestedOne = {
		type: 'nested-one',
		fields: [
			{
				type: 'primitive',
				field: desiredForeignField,
				alias: foreignIdFieldAlias,
			},
		],
		isA2O: true,
		alias: manyAlias,
	};

	const result = getNestedOneFromAny(field);

	const expected: AbstractSqlNestedOneFromAny = {
		queryGenerator: expect.any(Function),
		alias: field.alias,
	};

	expect(result).toStrictEqual(expected);

	// this is returned from the database. it's a JSON column which stores the relation
	const a2ORelation: A2ORelation = {
		fk: [
			{
				column: desiredForeignField,
				value: randomPkValue,
			},
		],
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
						column: a2ORelation.fk[0]!.column,
					},
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
				negate: false,
			},
		},
		parameters: [a2ORelation.fk[0]!.value],
		aliasMapping: new Map([[`${desiredForeignField}_RANDOM`, [foreignIdFieldAlias]]]),
		nestedManys: [],
	};

	expect(actualGeneratedQuery).toStrictEqual(expectedGeneratedQuery);
});
