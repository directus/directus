import { test, expect, beforeEach } from 'vitest';
import { join } from './join.js';
import { randomIdentifier } from '@directus/random';
import type { AbstractSqlQuery } from '@directus/data-sql';

let sample: {
	statement: AbstractSqlQuery;
};

let targetTable: string;
let targetColumn: string;
let compareToTable: string;
let compareToColumn: string;
let alias: string;

beforeEach(() => {
	targetTable = randomIdentifier();
	targetColumn = randomIdentifier();
	compareToTable = randomIdentifier();
	compareToColumn = randomIdentifier();
	alias = randomIdentifier();

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
			join: [
				{
					type: 'join',
					table: targetTable,
					as: alias,
					on: {
						type: 'condition',
						condition: {
							type: 'field-condition',
							target: {
								type: 'primitive',
								table: targetTable,
								column: targetColumn,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: compareToTable,
								column: compareToColumn,
							},
						},
						negate: false,
					},
				},
			],
			parameters: [],
		},
	};
});

test('With an alias', () => {
	expect(join(sample.statement)).toStrictEqual(
		`LEFT JOIN "${targetTable}" "${alias}" ON "${targetTable}"."${targetColumn}" = "${compareToTable}"."${compareToColumn}"`
	);
});

test('With an alias', () => {
	const targetTable2 = randomIdentifier();
	const targetColumn2 = randomIdentifier();
	const compareToTable2 = randomIdentifier();
	const compareToColumn2 = randomIdentifier();

	sample.statement.join = [
		{
			type: 'join',
			table: targetTable,
			as: alias,
			on: {
				type: 'logical',
				operator: 'and',
				negate: false,
				childNodes: [
					{
						type: 'condition',
						negate: false,
						condition: {
							type: 'field-condition',
							target: {
								type: 'primitive',
								table: targetTable,
								column: targetColumn,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: compareToTable,
								column: compareToColumn,
							},
						},
					},
					{
						type: 'condition',
						negate: false,
						condition: {
							type: 'field-condition',
							target: {
								type: 'primitive',
								table: targetTable2,
								column: targetColumn2,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: compareToTable2,
								column: compareToColumn2,
							},
						},
					},
				],
			},
		},
	];

	expect(join(sample.statement)).toStrictEqual(
		`LEFT JOIN "${targetTable}" "${alias}" ON "${targetTable}"."${targetColumn}" = "${compareToTable}"."${compareToColumn}" AND "${targetTable2}"."${targetColumn2}" = "${compareToTable2}"."${compareToColumn2}"`
	);
});
