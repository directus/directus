import type { AbstractQueryFieldNodeRelationalOneToMany } from '@directus/data';
import { expect, test } from 'vitest';
import { getNestedMany } from './create-nested-manys.js';
import type { AbstractSqlNestedMany } from '../../index.js';
import { randomIdentifier } from '@directus/random';
import { parameterIndexGenerator } from '../param-index-generator.js';

test('getNestedMany', () => {
	const localField = randomIdentifier();
	const foreignField = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();

	const fieldMeta: AbstractQueryFieldNodeRelationalOneToMany = {
		type: 'o2m',
		join: {
			local: {
				fields: [localField],
			},
			foreign: {
				store: foreignStore,
				collection: foreignTable,
				fields: [foreignField],
			},
		},
	};

	const idxGen = parameterIndexGenerator();

	const result = getNestedMany(
		fieldMeta,
		{
			clauses: {
				select: [],
				joins: [],
			},
			parameters: [],
			aliasMapping: new Map(),
			nestedManys: [],
		},
		idxGen,
		foreignTable
	);

	const expected: AbstractSqlNestedMany = {
		queryGenerator: expect.any(Function),
		localJoinFields: [localField],
		foreignJoinFields: [foreignField],
		alias: foreignTable,
	};

	expect(result).toStrictEqual(expected);
});
