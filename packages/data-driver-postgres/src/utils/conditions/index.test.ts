import type { AbstractSqlQueryConditionNode, AbstractSqlQueryLogicalNode } from '@directus/data-sql';
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

test('Convert filter on json value', () => {
	const tableIndex = randomInteger(0, 100);
	const jsonColumnName = randomIdentifier();
	const parameterIndex = randomInteger(0, 10);
	const pathItemIndex = randomInteger(10, 20);

	const where: AbstractSqlQueryConditionNode = {
		type: 'condition',
		negate: false,
		condition: {
			type: 'condition-string',
			target: {
				type: 'json',
				tableIndex,
				columnName: jsonColumnName,
				path: [pathItemIndex],
			},
			operation: 'eq',
			compareTo: {
				type: 'value',
				parameterIndex,
			},
		},
	};

	expect(conditionString(where)).toStrictEqual(
		`"t${tableIndex}"."${jsonColumnName}" ->> $${pathItemIndex + 1} = $${parameterIndex + 1}`,
	);
});

test('Convert logical filter on json value like for o2a', () => {
	const tableIndex = randomInteger(0, 100);
	const jsonColumnName = randomIdentifier();
	const parameterIndex1 = randomInteger(0, 100);
	const parameterIndex2 = randomInteger(0, 100);
	const parameterIndex3 = randomInteger(0, 100);
	const parameterIndex4 = randomInteger(0, 100);
	const parameterIndex5 = randomInteger(0, 100);

	const where: AbstractSqlQueryLogicalNode = {
		type: 'logical',
		operator: 'and',
		negate: false,
		childNodes: [
			{
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-string',
					target: {
						type: 'json',
						tableIndex,
						columnName: jsonColumnName,
						path: [parameterIndex1],
					},
					operation: 'eq',
					compareTo: {
						type: 'value',
						parameterIndex: parameterIndex2,
					},
				},
			},
			{
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-number',
					target: {
						type: 'json',
						tableIndex,
						columnName: jsonColumnName,
						path: [parameterIndex3, parameterIndex4],
					},
					operation: 'eq',
					compareTo: {
						type: 'value',
						parameterIndex: parameterIndex5,
					},
				},
			},
		],
	};

	expect(conditionString(where)).toStrictEqual(
		`"t${tableIndex}"."${jsonColumnName}" ->> $${parameterIndex1 + 1} = $${
			parameterIndex2 + 1
		} AND CAST("t${tableIndex}"."${jsonColumnName}" -> $${parameterIndex3 + 1} -> $${
			parameterIndex4 + 1
		} AS numeric) = $${parameterIndex5 + 1}`,
	);
});
