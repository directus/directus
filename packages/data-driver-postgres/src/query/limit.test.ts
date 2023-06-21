import { test, expect, beforeEach } from 'vitest';
import { limit } from './limit.js';
import { randomInteger, randomIdentifier } from '@directus/random';
import type { AbstractSqlQuery } from '@directus/data-sql';

let sample: {
	statement: AbstractSqlQuery;
};

beforeEach(() => {
	sample = {
		statement: {
			select: [
				{
					type: 'primitive',
					column: randomIdentifier(),
					table: randomIdentifier(),
					as: randomIdentifier(),
				},
				{ type: 'primitive', column: randomIdentifier(), table: randomIdentifier() },
			],
			from: randomIdentifier(),
			parameters: [],
		},
	};
});

test('Empty parametrized statement when limit is not defined', () => {
	expect(limit(sample.statement)).toStrictEqual('');
});

test('Returns limit part with one parameter', () => {
	sample.statement.limit = { parameterIndex: 0 };
	sample.statement.parameters = [randomInteger(1, 100)];

	expect(limit(sample.statement)).toStrictEqual(`LIMIT $1`);
});
