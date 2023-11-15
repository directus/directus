import type { AbstractQueryFieldNodeNestedMany } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import { afterAll, expect, test, vi } from 'vitest';
import type { AbstractSqlNestedMany, AbstractSqlQuery } from '../../index.js';
import { getNestedMany } from './create-nested-manys.js';

afterAll(() => {
	vi.restoreAllMocks();
});

vi.mock('../../orm/create-unique-alias.js', () => ({
	createUniqueAlias: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

test('getNestedMany with a single identifier', () => {
	const localIdField = randomIdentifier();
	const foreignIdField = randomIdentifier();
	const foreignIdFieldAlias = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();
	const randomPkValue = randomIdentifier();
	const manyAlias = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedMany = {
		type: 'nested-many',
		fields: [
			{
				type: 'primitive',
				field: foreignIdField,
				alias: foreignIdFieldAlias,
			},
		],
		meta: {
			type: 'o2m',
			join: {
				local: {
					fields: [localIdField],
				},
				foreign: {
					store: foreignStore,
					collection: foreignTable,
					fields: [foreignIdField],
				},
			},
		},
		alias: manyAlias,
		modifiers: {},
	};

	const result = getNestedMany(field);

	const expected: AbstractSqlNestedMany = {
		queryGenerator: expect.any(Function),
		localJoinFields: [localIdField],
		foreignJoinFields: [foreignIdField],
		alias: manyAlias,
	};

	const expectedGeneratedQuery: AbstractSqlQuery = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: foreignTable,
					column: foreignIdField,
					as: `${foreignIdField}_RANDOM`,
				},
			],
			from: foreignTable,
			joins: [],
			where: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					operation: 'eq',
					target: {
						type: 'primitive',
						table: foreignTable,
						column: foreignIdField,
					},
					compareTo: {
						type: 'value',
						parameterIndex: 0,
					},
				},
				negate: false,
			},
		},
		parameters: [randomPkValue],
		aliasMapping: new Map([[`${foreignIdField}_RANDOM`, [foreignIdFieldAlias]]]),
		nestedManys: [],
	};

	expect(result).toStrictEqual(expected);
	expect(result.queryGenerator([randomPkValue])).toStrictEqual(expectedGeneratedQuery);
});

test('getNestedMany with a multiple identifiers (a composite key)', () => {
	const localIdField1 = randomIdentifier();
	const localIdField2 = randomIdentifier();

	// the field the user wants to be returned
	const desiredForeignField = randomIdentifier();
	const desiredForeignFieldAlias = randomIdentifier();

	// the foreign keys
	const foreignIdField1 = randomIdentifier();
	const foreignIdField2 = randomIdentifier();

	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();

	// the values of the local identifier fields, returned by the root query
	const randomPkValue1 = randomIdentifier();
	const randomPkValue2 = randomIdentifier();
	const manyAlias = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedMany = {
		type: 'nested-many',
		fields: [
			{
				type: 'primitive',
				field: desiredForeignField,
				alias: desiredForeignFieldAlias,
			},
		],
		meta: {
			type: 'o2m',
			join: {
				local: {
					fields: [localIdField1, localIdField2],
				},
				foreign: {
					store: foreignStore,
					collection: foreignTable,
					fields: [foreignIdField1, foreignIdField2],
				},
			},
		},
		modifiers: {},
		alias: manyAlias,
	};

	const result = getNestedMany(field);

	const expected: AbstractSqlNestedMany = {
		queryGenerator: expect.any(Function),
		localJoinFields: [localIdField1, localIdField2],
		foreignJoinFields: [foreignIdField1, foreignIdField2],
		alias: manyAlias,
	};

	const expectedGeneratedQuery: AbstractSqlQuery = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: foreignTable,
					column: desiredForeignField,
					as: `${desiredForeignField}_RANDOM`,
				},
			],
			from: foreignTable,
			joins: [],
			where: {
				type: 'logical',
				operator: 'and',
				negate: false,
				childNodes: [
					{
						type: 'condition',
						condition: {
							type: 'condition-string',
							operation: 'eq',
							target: {
								type: 'primitive',
								table: foreignTable,
								column: foreignIdField1,
							},
							compareTo: {
								type: 'value',
								parameterIndex: 0,
							},
						},
						negate: false,
					},
					{
						type: 'condition',
						condition: {
							type: 'condition-string',
							operation: 'eq',
							target: {
								type: 'primitive',
								table: foreignTable,
								column: foreignIdField2,
							},
							compareTo: {
								type: 'value',
								parameterIndex: 1,
							},
						},
						negate: false,
					},
				],
			},
		},
		parameters: [randomPkValue1, randomPkValue2],
		aliasMapping: new Map([[`${desiredForeignField}_RANDOM`, [desiredForeignFieldAlias]]]),
		nestedManys: [],
	};

	expect(result).toStrictEqual(expected);
	expect(result.queryGenerator([randomPkValue1, randomPkValue2])).toMatchObject(expectedGeneratedQuery);
});

test('getNestedMany with a single identifier and some modifiers', () => {
	const localIdField = randomIdentifier();
	const foreignIdField = randomIdentifier();
	const foreignIdFieldAlias = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignStore = randomIdentifier();
	const randomPkValue = randomIdentifier();
	const randomCompareValue = randomIdentifier();
	const randomLimit = randomInteger(1, 100);
	const manyAlias = randomIdentifier();

	const field: AbstractQueryFieldNodeNestedMany = {
		type: 'nested-many',
		fields: [
			{
				type: 'primitive',
				field: foreignIdField,
				alias: foreignIdFieldAlias,
			},
		],
		meta: {
			type: 'o2m',
			join: {
				local: {
					fields: [localIdField],
				},
				foreign: {
					store: foreignStore,
					collection: foreignTable,
					fields: [foreignIdField],
				},
			},
		},
		modifiers: {
			filter: {
				type: 'condition',
				condition: {
					type: 'condition-string',
					operation: 'starts_with',
					target: {
						type: 'primitive',
						field: foreignIdField,
					},
					compareTo: randomCompareValue,
				},
			},
			limit: {
				type: 'limit',
				value: randomLimit,
			},
			sort: [
				{
					type: 'sort',
					direction: 'ascending',
					target: {
						type: 'primitive',
						field: foreignIdField,
					},
				},
			],
		},
		alias: manyAlias,
	};

	const result = getNestedMany(field);

	const expected: AbstractSqlNestedMany = {
		queryGenerator: expect.any(Function),
		localJoinFields: [localIdField],
		foreignJoinFields: [foreignIdField],
		alias: manyAlias,
	};

	const expectedGeneratedQuery: AbstractSqlQuery = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: foreignTable,
					column: foreignIdField,
					as: `${foreignIdField}_RANDOM`,
				},
			],
			from: foreignTable,
			joins: [],
			where: {
				type: 'logical',
				operator: 'and',
				negate: false,
				childNodes: [
					{
						type: 'condition',
						condition: {
							type: 'condition-string',
							operation: 'starts_with',
							target: {
								type: 'primitive',
								table: foreignTable,
								column: foreignIdField,
							},
							compareTo: {
								type: 'value',
								parameterIndex: 0,
							},
						},
						negate: false,
					},
					{
						type: 'condition',
						condition: {
							type: 'condition-string',
							operation: 'eq',
							target: {
								type: 'primitive',
								table: foreignTable,
								column: foreignIdField,
							},
							compareTo: {
								type: 'value',
								parameterIndex: 2,
							},
						},
						negate: false,
					},
				],
			},
			limit: {
				type: 'value',
				parameterIndex: 1,
			},
			order: [
				{
					type: 'order',
					orderBy: {
						type: 'primitive',
						table: foreignTable,
						column: foreignIdField,
					},
					direction: 'ASC',
				},
			],
		},
		parameters: [randomCompareValue, randomLimit, randomPkValue],
		aliasMapping: new Map([[`${foreignIdField}_RANDOM`, [foreignIdFieldAlias]]]),
		nestedManys: [],
	};

	expect(result).toStrictEqual(expected);
	expect(result.queryGenerator([randomPkValue])).toStrictEqual(expectedGeneratedQuery);
});
