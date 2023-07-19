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
				type: 'condition-number',
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

	test('between', () => {
		const randomTable = randomIdentifier();
		const aColumn = randomIdentifier();
		const parameterIndexes: [number, number] = [randomInteger(0, 100), randomInteger(0, 100)];

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'between-condition',
				target: {
					type: 'primitive',
					table: randomTable,
					column: aColumn,
				},
				operation: 'between',
				compareTo: {
					type: 'values',
					parameterIndexes,
				},
			},
		};

		expect(conditionString(where)).toStrictEqual(
			`"${randomTable}"."${aColumn}" BETWEEN [$${parameterIndexes[0] + 1}, $${parameterIndexes[1] + 1}]`
		);
	});

	test('letter', () => {
		const randomTable = randomIdentifier();
		const aColumn = randomIdentifier();
		const parameterIndex = randomInteger(0, 100);

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'condition-letter',
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
				type: 'condition-number',
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
				type: 'condition-geo',
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

		expect(conditionString(where)).toStrictEqual(
			`ST_Intersects(${wrappedCol}, ST_GeomFromText($${parameterIndex + 1}))`
		);
	});

	test('intersects_bbox', () => {
		const randomTable = randomIdentifier();
		const randomColumn = randomIdentifier();
		const parameterIndex = randomInteger(0, 100);

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'condition-geo',
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

		expect(conditionString(where)).toStrictEqual(`${wrappedCol} && ST_GeomFromText($${parameterIndex + 1}))`);
	});

	test('explicit sub set', () => {
		const randomTable = randomIdentifier();
		const randomColumn = randomIdentifier();

		const where: AbstractSqlQueryConditionNode = {
			type: 'condition',
			negate: false,
			condition: {
				type: 'condition-set',
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
					type: 'condition-number',
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
					type: 'condition-number',
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
					type: 'condition-number',
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
					type: 'condition-number',
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
							type: 'condition-number',
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
							type: 'condition-number',
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
