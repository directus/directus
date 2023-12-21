import type { AbstractQueryModifiers } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { expect, test } from 'vitest';
import { createIndexGenerators } from '../../utils/create-index-generators.js';
import { convertModifiers, type ModifierConversionResult } from './modifiers.js';

test('Convert primitive filter', () => {
	const tableIndex = randomInteger(0, 100);
	const columnName = randomIdentifier();
	const columnValue = randomInteger(1, 100);

	const modifiers: AbstractQueryModifiers = {
		filter: {
			type: 'condition',

			condition: {
				type: 'condition-number',

				operation: 'eq',
				target: {
					type: 'primitive',
					field: columnName,
				},
				compareTo: columnValue,
			},
		},
	};

	const expectedResult: ModifierConversionResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-number',
					operation: 'eq',
					target: {
						type: 'primitive',
						tableIndex,
						columnName,
					},
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
		},
		parameters: [columnValue],
	};

	const indexGen = createIndexGenerators();
	const result = convertModifiers(modifiers, tableIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});

test('Convert nested, primitive filter', () => {
	const tableIndex = randomInteger(0, 100);
	const foreignKeyColumnName = randomIdentifier();

	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalTableIndex = 0;
	const externalColumnName = randomIdentifier();
	const externalColumnValue = randomInteger(1, 100);
	const externalKeyColumnName = randomIdentifier();

	const modifiers: AbstractQueryModifiers = {
		filter: {
			type: 'condition',

			condition: {
				type: 'condition-number',

				operation: 'eq',
				target: {
					type: 'nested-one-target',
					field: {
						type: 'primitive',
						field: externalColumnName,
					},
					nesting: {
						type: 'relational-many',
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
				compareTo: externalColumnValue,
			},
		},
	};

	const expectedResult: ModifierConversionResult = {
		clauses: {
			where: {
				type: 'condition',
				negate: false,
				condition: {
					type: 'condition-number',
					operation: 'eq',
					target: {
						type: 'primitive',
						tableIndex: externalTableIndex,
						columnName: externalColumnName,
					},
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
			},
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
		},
		parameters: [externalColumnValue],
	};

	const indexGen = createIndexGenerators();
	const result = convertModifiers(modifiers, tableIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});

test('Convert nested sort', () => {
	const tableIndex = randomInteger(0, 100);
	const foreignKeyColumnName = randomIdentifier();

	const externalStore = randomIdentifier();
	const externalTableName = randomIdentifier();
	const externalTableIndex = 0;
	const externalColumnName = randomIdentifier();
	const externalKeyColumnName = randomIdentifier();

	const modifiers: AbstractQueryModifiers = {
		sort: [
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
						type: 'relational-many',
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
		],
	};

	const expectedResult: ModifierConversionResult = {
		clauses: {
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
		},
		parameters: [],
	};

	const indexGen = createIndexGenerators();
	const result = convertModifiers(modifiers, tableIndex, indexGen);

	expect(result).toStrictEqual(expectedResult);
});
