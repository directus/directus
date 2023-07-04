import type { AbstractSqlQuery, AbstractSqlQueryConditionNode, ValueNode } from '@directus/data-sql';
import { beforeEach, describe, expect, test } from 'vitest';
import { where } from './where.js';
import { randomIdentifier, randomInteger } from '@directus/random';

let sample: {
	statement: AbstractSqlQuery;
};

describe('Where clause:', () => {
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
					operation: 'gt',
					negate: false,
					target: {
						type: 'primitive',
						column: randomIdentifier(),
						table: randomIdentifier(),
					},
					compareTo: {
						type: 'value',
						parameterIndexes: [0],
					},
				},
				parameters: [randomInteger(1, 10)],
			},
		};
	});

	test('Where clause', () => {
		expect(where(sample.statement)).toStrictEqual(
			`WHERE "${(sample.statement.where as AbstractSqlQueryConditionNode).target.table}"."${
				(sample.statement.where as AbstractSqlQueryConditionNode).target.column
			}" > $${
				((sample.statement.where as AbstractSqlQueryConditionNode).compareTo as ValueNode).parameterIndexes[0]! + 1
			}`
		);
	});

	test('Where clause with negation', () => {
		sample.statement.where!.negate = true;

		expect(where(sample.statement)).toStrictEqual(
			`WHERE "${(sample.statement.where as AbstractSqlQueryConditionNode).target.table}"."${
				(sample.statement.where as AbstractSqlQueryConditionNode).target.column
			}" <= $${
				((sample.statement.where as AbstractSqlQueryConditionNode).compareTo as ValueNode).parameterIndexes[0]! + 1
			}`
		);
	});
});
