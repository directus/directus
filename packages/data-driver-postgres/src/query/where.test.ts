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

test('Convert filter with logical', () => {
	const randomTable = randomIdentifier();
	const randomColumn = randomIdentifier();

	const firstColumn = randomIdentifier();
	const secondColumn = randomIdentifier();
	const firstValue = randomInteger(1, 100);
	const secondValue = randomInteger(1, 100);

	const statement: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: randomTable,
				column: randomColumn,
			},
		],
		from: randomTable,
		where: {
			type: 'logical',
			operator: 'or',
			negate: false,
			childNodes: [
				{
					type: 'condition',
					negate: false,
					target: {
						type: 'primitive',
						table: randomTable,
						column: firstColumn,
					},
					operation: 'gt',
					compareTo: {
						type: 'value',
						parameterIndexes: [0],
					},
				},
				{
					type: 'condition',
					negate: false,
					target: {
						type: 'primitive',
						table: randomTable,
						column: secondColumn,
					},
					operation: 'eq',
					compareTo: {
						type: 'value',
						parameterIndexes: [1],
					},
				},
			],
		},
		parameters: [firstValue, secondValue],
	};

	expect(where(statement)).toStrictEqual(
		`WHERE "${randomTable}"."${firstColumn}" > $1 OR "${randomTable}"."${secondColumn}" = $2`
	);
});

test('Convert filter nested and with negation', () => {
	const randomTable = randomIdentifier();
	const randomColumn = randomIdentifier();

	const firstColumn = randomIdentifier();
	const secondColumn = randomIdentifier();
	const thirdColumn = randomIdentifier();
	const fourthColumn = randomIdentifier();

	const firstValue = randomInteger(1, 100);
	const secondValue = randomInteger(1, 100);
	const thirdValue = randomInteger(1, 100);
	const fourthValue = randomInteger(1, 100);

	const statement: AbstractSqlQuery = {
		select: [
			{
				type: 'primitive',
				table: randomTable,
				column: randomColumn,
			},
		],
		from: randomTable,
		where: {
			type: 'logical',
			operator: 'or',
			negate: false,
			childNodes: [
				{
					type: 'condition',
					negate: false,
					target: {
						type: 'primitive',
						table: randomTable,
						column: firstColumn,
					},
					operation: 'gt',
					compareTo: {
						type: 'value',
						parameterIndexes: [0],
					},
				},
				{
					type: 'condition',
					negate: true,
					target: {
						type: 'primitive',
						table: randomTable,
						column: secondColumn,
					},
					operation: 'eq',
					compareTo: {
						type: 'value',
						parameterIndexes: [1],
					},
				},
				{
					type: 'logical',
					operator: 'and',
					negate: true,
					childNodes: [
						{
							type: 'condition',
							negate: true,
							target: {
								type: 'primitive',
								table: randomTable,
								column: thirdColumn,
							},
							operation: 'lt',
							compareTo: {
								type: 'value',
								parameterIndexes: [2],
							},
						},
						{
							type: 'condition',
							negate: false,
							target: {
								type: 'primitive',
								table: randomTable,
								column: fourthColumn,
							},
							operation: 'eq',
							compareTo: {
								type: 'value',
								parameterIndexes: [3],
							},
						},
					],
				},
			],
		},
		parameters: [firstValue, secondValue, thirdValue, fourthValue],
	};

	expect(where(statement)).toStrictEqual(
		`WHERE "${randomTable}"."${firstColumn}" > $1 OR "${randomTable}"."${secondColumn}" != $2 OR NOT ("${randomTable}"."${thirdColumn}" >= $3 AND "${randomTable}"."${fourthColumn}" = $4)`
	);
});
