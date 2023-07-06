import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '@directus/data-sql';
import { expect, test } from 'vitest';
import { randomIdentifier } from '@directus/random';
import { conditionString } from './condition-string.js';

test('Convert filter with logical', () => {
	const randomTable = randomIdentifier();

	const firstColumn = randomIdentifier();
	const secondColumn = randomIdentifier();

	const where: AbstractSqlQueryLogicalNode = {
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
	};

	expect(conditionString(where)).toStrictEqual(
		`"${randomTable}"."${firstColumn}" > $1 OR "${randomTable}"."${secondColumn}" = $2`
	);
});

test('Convert filter condition', () => {
	const randomTable = randomIdentifier();
	const aColumn = randomIdentifier();

	const where: AbstractSqlQueryConditionNode = {
		type: 'condition',
		negate: false,
		target: {
			type: 'fn',
			fn: 'month',
			input: {
				type: 'primitive',
				table: randomTable,
				column: aColumn,
			},
			arguments: {
				type: 'value',
				parameterIndexes: [],
			},
		},
		operation: 'gt',
		compareTo: {
			type: 'value',
			parameterIndexes: [0],
		},
	};

	expect(conditionString(where)).toStrictEqual(`EXTRACT(MONTH FROM "${randomTable}"."${aColumn}") > $1`);
});

test('Convert filter nested and with negation', () => {
	const randomTable = randomIdentifier();

	const firstColumn = randomIdentifier();
	const secondColumn = randomIdentifier();
	const thirdColumn = randomIdentifier();
	const fourthColumn = randomIdentifier();

	const where: AbstractSqlQueryLogicalNode = {
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
	};

	expect(conditionString(where)).toStrictEqual(
		`"${randomTable}"."${firstColumn}" > $1 OR "${randomTable}"."${secondColumn}" != $2 OR NOT ("${randomTable}"."${thirdColumn}" >= $3 AND "${randomTable}"."${fourthColumn}" = $4)`
	);
});
