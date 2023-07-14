import { test, expect, beforeEach } from 'vitest';
import { offset } from './offset.js';
import { randomIdentifier } from '@directus/random';
import type { AbstractSqlQuery } from '@directus/data-sql';

let sample: {
	statement: AbstractSqlQuery;
};

beforeEach(() => {
	sample = {
		statement: {
			type: 'query',
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

test('Empty string when offset is not defined', () => {
	expect(offset(sample.statement)).toStrictEqual(null);
});

test('Returns offset', () => {
	sample.statement.offset = { parameterIndex: 0 };
	expect(offset(sample.statement)).toStrictEqual(`OFFSET $1`);
});
