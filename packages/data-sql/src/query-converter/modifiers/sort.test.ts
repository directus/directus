import type { AbstractQueryNodeSort, AtLeastOneElement } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../utils/create-index-generators.js';
import { convertSort, type SortConversionResult } from './sort.js';

test('convert ascending sort with a single field', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();

	const sorts: AtLeastOneElement<AbstractQueryNodeSort> = [
		{
			type: 'sort',
			direction: 'ascending',
			target: {
				type: 'primitive',
				field: columnName,
			},
		},
	];

	const expectedResult: SortConversionResult = {
		clauses: {
			joins: [],
			order: [
				{
					type: 'order',
					orderBy: {
						type: 'primitive',
						tableIndex,
						columnName,
					},
					direction: 'ASC',
				},
			],
		},
		parameters: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertSort(sorts, tableIndex, indexGen);
	expect(result).toStrictEqual(expectedResult);
});

test('convert descending sort with a single field', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();

	const sorts: AtLeastOneElement<AbstractQueryNodeSort> = [
		{
			type: 'sort',
			direction: 'descending',
			target: {
				type: 'primitive',
				field: columnName,
			},
		},
	];

	const expectedResult: SortConversionResult = {
		clauses: {
			joins: [],
			order: [
				{
					type: 'order',
					orderBy: {
						type: 'primitive',
						tableIndex,
						columnName,
					},
					direction: 'DESC',
				},
			],
		},
		parameters: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertSort(sorts, tableIndex, indexGen);
	expect(result).toStrictEqual(expectedResult);
});

test('convert ascending sort with multiple fields', () => {
	const tableIndex = randomInteger(0, 100);
	const column1Name = randomIdentifier();
	const column2Name = randomIdentifier();

	const sorts: AtLeastOneElement<AbstractQueryNodeSort> = [
		{
			type: 'sort',
			direction: 'ascending',
			target: {
				type: 'primitive',
				field: column1Name,
			},
		},
		{
			type: 'sort',
			direction: 'descending',
			target: {
				type: 'primitive',
				field: column2Name,
			},
		},
	];

	const expectedResult: SortConversionResult = {
		clauses: {
			joins: [],
			order: [
				{
					type: 'order',
					orderBy: {
						type: 'primitive',
						tableIndex,
						columnName: column1Name,
					},
					direction: 'ASC',
				},
				{
					type: 'order',
					orderBy: {
						type: 'primitive',
						tableIndex,
						columnName: column2Name,
					},
					direction: 'DESC',
				},
			],
		},
		parameters: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertSort(sorts, tableIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});

test('convert sort on nested item', () => {
	const tableIndex = randomInteger(0, 100);
	const foreignKeyColumnName = randomIdentifier();
	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalTableIndex = 0;
	const externalColumnName = randomIdentifier();
	const externalKeyColumnName = randomIdentifier();

	const sorts: AtLeastOneElement<AbstractQueryNodeSort> = [
		{
			type: 'sort',
			direction: 'ascending',
			target: {
				type: 'nested-one-target',
				field: {
					type: 'primitive',
					field: externalColumnName,
				},
				nesting: {
					type: 'relational-single',
					local: {
						fields: [foreignKeyColumnName],
					},
					foreign: {
						store: externalStore,
						collection: externalTableName,
						fields: [externalKeyColumnName],
					},
				},
			},
		},
	];

	const expectedResult: SortConversionResult = {
		clauses: {
			joins: [
				{
					type: 'join',
					tableName: externalTableName,
					tableIndex: externalTableIndex,
					on: {
						type: 'condition',
						negate: false,
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								tableIndex,
								columnName: foreignKeyColumnName,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								tableIndex: externalTableIndex,
								columnName: externalKeyColumnName,
							},
						},
					},
				},
			],
			order: [
				{
					type: 'order',
					orderBy: {
						type: 'primitive',
						tableIndex: externalTableIndex,
						columnName: externalColumnName,
					},
					direction: 'ASC',
				},
			],
		},
		parameters: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertSort(sorts, tableIndex, indexGen);
	expect(result).toStrictEqual(expectedResult);
});
