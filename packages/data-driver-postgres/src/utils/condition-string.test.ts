import type {
	AbstractSqlQueryConditionNode,
	AbstractSqlQueryLogicalNode,
	SqlGeoConditionNode,
	SqlSetConditionNode,
} from '@directus/data-sql';
import { expect, test, describe } from 'vitest';
import { randomIdentifier } from '@directus/random';
import { conditionString } from './condition-string.js';

describe('Conditions', () => {
	test('number', () => {
		const randomTable = randomIdentifier();
		const aColumn = randomIdentifier();

		const where: AbstractSqlQueryConditionNode = {
			type: 'number-condition',
			negate: false,
			target: {
				type: 'primitive',
				table: randomTable,
				column: aColumn,
			},
			operation: 'gt',
			compareTo: {
				type: 'value',
				parameterIndexes: [0],
			},
		};

		expect(conditionString(where)).toStrictEqual(`"${randomTable}"."${aColumn}" > $1`);
	});

	test('letter', () => {
		const randomTable = randomIdentifier();
		const aColumn = randomIdentifier();

		const where: AbstractSqlQueryConditionNode = {
			type: 'letter-condition',
			negate: false,
			target: {
				type: 'primitive',
				table: randomTable,
				column: aColumn,
			},
			operation: 'starts_with',
			compareTo: {
				type: 'value',
				parameterIndexes: [0],
			},
		};

		expect(conditionString(where)).toStrictEqual(`"${randomTable}"."${aColumn}" LIKE '$1%'`);
	});

	test('month function', () => {
		const randomTable = randomIdentifier();
		const aColumn = randomIdentifier();

		const where: AbstractSqlQueryConditionNode = {
			type: 'number-condition',
			negate: false,
			target: {
				type: 'fn',
				fn: 'month',
				field: {
					type: 'primitive',
					table: randomTable,
					column: aColumn,
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

	test('st_intersects', () => {
		const randomTable = randomIdentifier();
		const randomColumn = randomIdentifier();

		const where: SqlGeoConditionNode = {
			type: 'geo-condition',
			negate: false,
			target: {
				type: 'primitive',
				table: randomTable,
				column: randomColumn,
			},
			operation: 'intersects',
			compareTo: {
				type: 'value',
				parameterIndexes: [0],
			},
		};

		const wrappedCol = `"${randomTable}"."${randomColumn}"`;

		expect(conditionString(where)).toStrictEqual(`ST_Intersects(${wrappedCol}, $1)`);
	});

	test('explicit sub set', () => {
		const randomTable = randomIdentifier();
		const randomColumn = randomIdentifier();

		const where: SqlSetConditionNode = {
			type: 'set-condition',
			negate: false,
			target: {
				type: 'primitive',
				table: randomTable,
				column: randomColumn,
			},
			operation: 'in',
			compareTo: {
				type: 'values',
				parameterIndexes: [2, 3, 4],
			},
		};

		const wrappedCol = `"${randomTable}"."${randomColumn}"`;

		expect(conditionString(where)).toStrictEqual(`${wrappedCol} IN ($3, $4, $5)`);
	});

	test('sub query', () => {
		const randomTable = randomIdentifier();
		const randomColumn = randomIdentifier();
		const randomTable2 = randomIdentifier();
		const randomColumn2 = randomIdentifier();
		const randomTable3 = randomIdentifier();

		const where: SqlSetConditionNode = {
			type: 'set-condition',
			negate: false,
			target: {
				type: 'primitive',
				table: randomTable,
				column: randomColumn,
			},
			operation: 'lt',
			compareTo: {
				type: 'query',
				select: [
					{
						type: 'fn',
						fn: 'count',
						field: {
							type: 'primitive',
							table: randomTable2,
							column: randomColumn2,
						},
					},
				],
				from: randomTable3,
				parameters: [],
			},
		};

		expect(conditionString(where)).toStrictEqual(
			`"${randomTable}"."${randomColumn}" < (SELECT COUNT("${randomTable2}"."${randomColumn2}") FROM "${randomTable3}")`
		);
	});
});

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
				type: 'number-condition',
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
				type: 'number-condition',
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
				type: 'number-condition',
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
				type: 'number-condition',
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
						type: 'number-condition',
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
						type: 'number-condition',
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
