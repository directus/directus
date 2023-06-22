import type { AbstractSqlQuery } from '@directus/data-sql';
import { beforeEach, expect, test } from 'vitest';
import { where } from './where.js';
import { randomIdentifier, randomInteger } from '@directus/random';

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
			where: {
				type: 'condition',
				operation: '>',
				target: {
					type: 'primitive',
					column: randomIdentifier(),
					table: randomIdentifier(),
				},
				value: {
					parameterIndex: randomInteger(1, 10),
				},
				negation: false,
			},
			parameters: [],
		},
	};
});

test('Where clause with gt', () => {
	expect(where(sample.statement)).toStrictEqual(
		`WHERE "${sample.statement.where!.target.table}"."${sample.statement.where!.target.column}" > $${
			sample.statement.where!.value.parameterIndex + 1
		}`
	);
});

test('Where clause with eq', () => {
	sample.statement.where!.operation = '=';

	expect(where(sample.statement)).toStrictEqual(
		`WHERE "${sample.statement.where!.target.table}"."${sample.statement.where!.target.column}" = $${
			sample.statement.where!.value.parameterIndex + 1
		}`
	);
});
