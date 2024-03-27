import { test, expect, beforeEach } from 'vitest';
import { join } from './join.js';
import { randomIdentifier, randomInteger } from '@directus/random';
import type { AbstractSqlClauses } from '@directus/data-sql';

let sample: AbstractSqlClauses;
let foreignTableName: string;
let foreignTableIndex: number;
let foreignColumnName: string;
let foreignColumnIndex: number;
let compareToTableIndex: number;
let compareToColumnName: string;

beforeEach(() => {
	foreignTableName = randomIdentifier();
	foreignTableIndex = randomInteger(0, 100);
	foreignColumnName = randomIdentifier();
	foreignColumnIndex = randomInteger(0, 100);
	compareToTableIndex = randomInteger(0, 100);
	compareToColumnName = randomIdentifier();

	sample = {
		select: [
			{
				type: 'primitive',
				tableIndex: foreignTableIndex,
				columnName: randomIdentifier(),
				columnIndex: foreignColumnIndex,
			},
		],
		from: {
			tableName: randomIdentifier(),
			tableIndex: randomInteger(0, 100),
		},
		joins: [
			{
				type: 'join',
				tableName: foreignTableName,
				tableIndex: foreignTableIndex,
				on: {
					type: 'condition',
					condition: {
						type: 'condition-field',
						target: {
							type: 'primitive',
							tableIndex: foreignTableIndex,
							columnName: foreignColumnName,
						},
						operation: 'eq',
						compareTo: {
							type: 'primitive',
							tableIndex: compareToTableIndex,
							columnName: compareToColumnName,
						},
					},
					negate: false,
				},
			},
		],
	};
});

test('Simple join', () => {
	expect(join(sample)).toStrictEqual(
		`LEFT JOIN "${foreignTableName}" AS "t${foreignTableIndex}" ON "t${foreignTableIndex}"."${foreignColumnName}" = "t${compareToTableIndex}"."${compareToColumnName}"`,
	);
});

test('Nested join', () => {
	const targetTable2Index = randomInteger(0, 100);
	const targetColumn2 = randomIdentifier();
	const compareToTable2Index = randomInteger(0, 100);
	const compareToColumn2 = randomIdentifier();

	sample.joins = [
		{
			type: 'join',
			tableName: foreignTableName,
			tableIndex: foreignTableIndex,
			on: {
				type: 'logical',
				operator: 'and',
				negate: false,
				childNodes: [
					{
						type: 'condition',
						negate: false,
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								tableIndex: foreignTableIndex,
								columnName: foreignColumnName,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								tableIndex: compareToTableIndex,
								columnName: compareToColumnName,
							},
						},
					},
					{
						type: 'condition',
						negate: false,
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								tableIndex: targetTable2Index,
								columnName: targetColumn2,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								tableIndex: compareToTable2Index,
								columnName: compareToColumn2,
							},
						},
					},
				],
			},
		},
	];

	expect(join(sample)).toStrictEqual(
		`LEFT JOIN "${foreignTableName}" AS "t${foreignTableIndex}" ON "t${foreignTableIndex}"."${foreignColumnName}" = "t${compareToTableIndex}"."${compareToColumnName}" AND "t${targetTable2Index}"."${targetColumn2}" = "t${compareToTable2Index}"."${compareToColumn2}"`,
	);
});
