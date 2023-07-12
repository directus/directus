import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '@directus/data-sql';
import { expect, test, describe } from 'vitest';
import { randomIdentifier, randomInteger } from '@directus/random';
import { conditionString } from './condition-string.js';

describe('Conditions', () => {
	test('number', () => {
		const randomTable = randomIdentifier();
		const aColumn = randomIdentifier();
		const parameterIndex = randomInteger(0, 100);

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'number-condition',
				target: {
					type: 'primitive',
					table: randomTable,
					column: aColumn,
				},
				operation: 'gt',
				compareTo: {
					type: 'value',
					parameterIndex,
				},
			},
		};

		expect(conditionString(where)).toStrictEqual(`"${randomTable}"."${aColumn}" > $${parameterIndex + 1}`);
	});

	test('letter', () => {
		const randomTable = randomIdentifier();
		const aColumn = randomIdentifier();
		const parameterIndex = randomInteger(0, 100);

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'letter-condition',
				target: {
					type: 'primitive',
					table: randomTable,
					column: aColumn,
				},
				operation: 'starts_with',
				compareTo: {
					type: 'value',
					parameterIndex,
				},
			},
		};

		expect(conditionString(where)).toStrictEqual(`"${randomTable}"."${aColumn}" LIKE '$${parameterIndex + 1}%'`);
	});

	test('month function', () => {
		const randomTable = randomIdentifier();
		const aColumn = randomIdentifier();
		const parameterIndex = randomInteger(0, 100);

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'number-condition',
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
					parameterIndex,
				},
			},
		};

		expect(conditionString(where)).toStrictEqual(
			`EXTRACT(MONTH FROM "${randomTable}"."${aColumn}") > $${parameterIndex + 1}`
		);
	});

	test('intersects', () => {
		const randomTable = randomIdentifier();
		const randomColumn = randomIdentifier();
		const parameterIndex = randomInteger(0, 100);

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'geo-condition',
				target: {
					type: 'primitive',
					table: randomTable,
					column: randomColumn,
				},
				operation: 'intersects',
				compareTo: {
					type: 'value',
					parameterIndex,
				},
			},
		};

		const wrappedCol = `"${randomTable}"."${randomColumn}"`;

		expect(conditionString(where)).toStrictEqual(`ST_Intersects(${wrappedCol}, $${parameterIndex + 1})`);
	});

	test('intersects_bbox', () => {
		const randomTable = randomIdentifier();
		const randomColumn = randomIdentifier();
		const parameterIndex = randomInteger(0, 100);

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'geo-condition',
				target: {
					type: 'primitive',
					table: randomTable,
					column: randomColumn,
				},
				operation: 'intersects_bbox',
				compareTo: {
					type: 'value',
					parameterIndex,
				},
			},
		};

		const wrappedCol = `"${randomTable}"."${randomColumn}"`;

		expect(conditionString(where)).toStrictEqual(`${wrappedCol} && $${parameterIndex + 1})`);
	});

	test('explicit sub set', () => {
		const randomTable = randomIdentifier();
		const randomColumn = randomIdentifier();

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'set-condition',
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

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'set-condition',
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
				type: 'condition',
				negate: false,
				condition: {
					type: 'number-condition',
					target: {
						type: 'primitive',
						table: randomTable,
						column: firstColumn,
					},
					operation: 'gt',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
			{
				type: 'condition',
				negate: false,
				condition: {
					type: 'number-condition',
					target: {
						type: 'primitive',
						table: randomTable,
						column: secondColumn,
					},
					operation: 'eq',
					compareTo: {
						type: 'value',
						parameterIndex: 1,
					},
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
				type: 'condition',
				negate: false,
				condition: {
					type: 'number-condition',
					target: {
						type: 'primitive',
						table: randomTable,
						column: firstColumn,
					},
					operation: 'gt',
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
			{
				type: 'condition',
				negate: true,
				condition: {
					type: 'number-condition',
					target: {
						type: 'primitive',
						table: randomTable,
						column: secondColumn,
					},
					operation: 'eq',
					compareTo: {
						type: 'value',
						parameterIndex: 1,
					},
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
						condition: {
							type: 'number-condition',
							target: {
								type: 'primitive',
								table: randomTable,
								column: thirdColumn,
							},
							operation: 'lt',
							compareTo: {
								type: 'value',
								parameterIndex: 2,
							},
						},
					},
					{
						type: 'condition',
						negate: false,
						condition: {
							type: 'number-condition',
							target: {
								type: 'primitive',
								table: randomTable,
								column: fourthColumn,
							},
							operation: 'eq',
							compareTo: {
								type: 'value',
								parameterIndex: 3,
							},
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
