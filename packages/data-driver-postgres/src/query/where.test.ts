import type { AbstractSqlQuery } from '@directus/data-sql';
import { beforeEach, describe, expect, test } from 'vitest';
import { where, getComparison } from './where.js';
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
					target: {
						type: 'primitive',
						column: randomIdentifier(),
						table: randomIdentifier(),
					},
					parameterIndexes: [randomInteger(1, 10)],
					negation: false,
				},
				parameters: [],
			},
		};
	});

	test('Where clause', () => {
		expect(where(sample.statement)).toStrictEqual(
			`WHERE "${sample.statement.where!.target.table}"."${sample.statement.where!.target.column}" > $${
				sample.statement.where!.parameterIndexes[0]! + 1
			}`
		);
	});

	test('Where clause with negation', () => {
		sample.statement.where!.negation = true;

		expect(where(sample.statement)).toStrictEqual(
			`WHERE NOT "${sample.statement.where!.target.table}"."${sample.statement.where!.target.column}" > $${
				sample.statement.where!.parameterIndexes[0]! + 1
			}`
		);
	});
});

describe('Where clause operator mapping and parameter index insertion: ', () => {
	test('eq', () => {
		const randomIndexes = [randomInteger(1, 10)];
		expect(getComparison('eq', randomIndexes)).toStrictEqual(`= $${randomIndexes[0]! + 1}`);
	});

	test('gt', () => {
		const randomIndexes = [randomInteger(1, 10)];
		expect(getComparison('gt', randomIndexes)).toStrictEqual(`> $${randomIndexes[0]! + 1}`);
	});

	test('gte', () => {
		const randomIndexes = [randomInteger(1, 10)];
		expect(getComparison('gte', randomIndexes)).toStrictEqual(`>= $${randomIndexes[0]! + 1}`);
	});

	test('lt', () => {
		const randomIndexes = [randomInteger(1, 10)];
		expect(getComparison('lt', randomIndexes)).toStrictEqual(`< $${randomIndexes[0]! + 1}`);
	});

	test('lte', () => {
		const randomIndexes = [randomInteger(1, 10)];
		expect(getComparison('lte', randomIndexes)).toStrictEqual(`<= $${randomIndexes[0]! + 1}`);
	});

	test('contains', () => {
		const randomIndexes = [randomInteger(1, 10)];
		expect(getComparison('contains', randomIndexes)).toStrictEqual(`LIKE '%$${randomIndexes[0]! + 1}%'`);
	});

	test('starts_with', () => {
		const randomIndexes = [randomInteger(1, 10)];
		expect(getComparison('starts_with', randomIndexes)).toStrictEqual(`LIKE '$${randomIndexes[0]! + 1}%'`);
	});

	test('ends_with', () => {
		const randomIndexes = [randomInteger(1, 10)];
		expect(getComparison('ends_with', randomIndexes)).toStrictEqual(`LIKE '%$${randomIndexes[0]! + 1}'`);
	});

	test('in', () => {
		const randomIndexes = [randomInteger(1, 10), randomInteger(1, 10)];

		expect(getComparison('in', randomIndexes)).toStrictEqual(
			`IN ($${randomIndexes[0]! + 1}, $${randomIndexes[1]! + 1})`
		);
	});
});
