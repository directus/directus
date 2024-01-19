import type { AbstractSqlQueryLogicalNode } from '@directus/data-sql';
import { expect, test } from 'vitest';
import { randomIdentifier, randomInteger } from '@directus/random';
import { conditionString } from './index.js';

test('Convert filter with logical', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName1 = randomIdentifier();
	const columnName2 = randomIdentifier();

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
						tableIndex,
						columnName: columnName1,
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
						tableIndex,
						columnName: columnName2,
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
		`"t${tableIndex}"."${columnName1}" > $1 OR "t${tableIndex}"."${columnName2}" = $2`,
	);
});

test('Convert filter nested and with negation', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName1 = randomIdentifier();
	const columnName2 = randomIdentifier();
	const columnName3 = randomIdentifier();
	const columnName4 = randomIdentifier();

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
						tableIndex,
						columnName: columnName1,
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
						tableIndex,
						columnName: columnName2,
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
								tableIndex,
								columnName: columnName3,
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
								tableIndex,
								columnName: columnName4,
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
		`"t${tableIndex}"."${columnName1}" > $1 OR "t${tableIndex}"."${columnName2}" != $2 OR NOT ("t${tableIndex}"."${columnName3}" >= $3 AND "t${tableIndex}"."${columnName4}" = $4)`,
	);
});
