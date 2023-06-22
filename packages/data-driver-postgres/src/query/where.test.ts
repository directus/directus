import type { AbstractSqlQuery } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { where } from './where.js';
import { randomIdentifier } from '@directus/random';

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
			],
			from: randomIdentifier(),
			parameters: [],
		},
	};
});

test('Where clause', () => {
	sample.statement.where = {
		type: 'condition',
		operation: '>',
		target: {
			type: 'primitive',
			column: randomIdentifier(),
			table: randomIdentifier(),
		},
		value: {
			parameterIndex: 0,
		},
		negation: false,
	};

	expect(where(sample.statement)).toStrictEqual(
		`WHERE "${sample.statement.where.target.table}"."${sample.statement.where.target.column}" > $1`
	);
});
