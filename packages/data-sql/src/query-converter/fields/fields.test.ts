import { expect, test, vi, afterAll, beforeEach } from 'vitest';
import { convertFieldNodes, type FieldConversionResult } from './fields.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
import type { AbstractQueryFieldNode } from '@directus/data';
import { randomIdentifier, randomInteger } from '@directus/random';
import type { AbstractSqlQuery } from '../../index.js';

afterAll(() => {
	vi.restoreAllMocks();
});

vi.mock('../../orm/create-unique-alias.js', () => ({
	createUniqueAlias: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

let randomPrimitiveField1: string;
let randomPrimitiveField2: string;
let randomPrimitiveFieldAlias1: string;
let randomPrimitiveFieldAlias2: string;
let randomCollection: string;

beforeEach(() => {
	randomPrimitiveField1 = randomIdentifier();
	randomPrimitiveField2 = randomIdentifier();
	randomPrimitiveFieldAlias1 = randomIdentifier();
	randomPrimitiveFieldAlias2 = randomIdentifier();
	randomCollection = randomIdentifier();
});

test('primitives only', () => {
	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: randomPrimitiveField1,
			alias: randomPrimitiveFieldAlias1,
		},
		{
			type: 'primitive',
			field: randomPrimitiveField2,
			alias: randomPrimitiveFieldAlias2,
		},
	];

	const expected: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: randomCollection,
					column: randomPrimitiveField1,
					as: `${randomPrimitiveField1}_RANDOM`,
				},
				{
					type: 'primitive',
					table: randomCollection,
					column: randomPrimitiveField2,
					as: `${randomPrimitiveField2}_RANDOM`,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: new Map([
			[`${randomPrimitiveField1}_RANDOM`, [randomPrimitiveFieldAlias1]],
			[`${randomPrimitiveField2}_RANDOM`, [randomPrimitiveFieldAlias2]],
		]),
		nestedManys: [],
	};

	const idGen = parameterIndexGenerator();
	const result = convertFieldNodes(randomCollection, fields, idGen);
	expect(result.clauses).toMatchObject(expected.clauses);
	expect(result.parameters).toMatchObject(expected.parameters);
	expect(result.aliasMapping).toMatchObject(expected.aliasMapping);
});

test('primitive and function', () => {
	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: randomPrimitiveField1,
			alias: randomPrimitiveFieldAlias1,
		},
		{
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: randomPrimitiveField2,
			alias: randomPrimitiveFieldAlias2,
		},
	];

	const expected: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: randomCollection,
					column: randomPrimitiveField1,
					as: `${randomPrimitiveField1}_RANDOM`,
				},
				{
					type: 'fn',
					fn: {
						type: 'extractFn',
						fn: 'month',
					},
					table: randomCollection,
					column: randomPrimitiveField2,
					as: `month_${randomPrimitiveField2}_RANDOM`,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: new Map([
			[`${randomPrimitiveField1}_RANDOM`, [randomPrimitiveFieldAlias1]],
			[`month_${randomPrimitiveField2}_RANDOM`, [randomPrimitiveFieldAlias2]],
		]),
		nestedManys: [],
	};

	const idGen = parameterIndexGenerator();
	const result = convertFieldNodes(randomCollection, fields, idGen);
	expect(result.clauses).toMatchObject(expected.clauses);
	expect(result.parameters).toMatchObject(expected.parameters);
	expect(result.aliasMapping).toMatchObject(expected.aliasMapping);
});

test('primitive, fn, m2o', () => {
	const randomJoinCurrentField = randomIdentifier();
	const randomExternalCollection = randomIdentifier();
	const randomExternalStore = randomIdentifier();
	const randomExternalField = randomIdentifier();
	const randomJoinNodeField = randomIdentifier();
	const randomJoinNodeFieldAlias = randomIdentifier();
	const randomPrimitiveFieldFn = randomIdentifier();
	const randomPrimitiveFieldFnAlias = randomIdentifier();
	const randomNestedAlias = randomIdentifier();

	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: randomPrimitiveField1,
			alias: randomPrimitiveFieldAlias1,
		},
		{
			type: 'nested-one',
			fields: [
				{
					type: 'primitive',
					field: randomJoinNodeField,
					alias: randomJoinNodeFieldAlias,
				},
			],
			meta: {
				type: 'm2o',
				join: {
					local: {
						fields: [randomJoinCurrentField],
					},
					foreign: {
						store: randomExternalStore,
						collection: randomExternalCollection,
						fields: [randomExternalField],
					},
				},
			},
			alias: randomNestedAlias,
		},
		{
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: randomPrimitiveFieldFn,
			alias: randomPrimitiveFieldFnAlias,
		},
	];

	const expected: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: randomCollection,
					column: randomPrimitiveField1,
					as: `${randomPrimitiveField1}_RANDOM`,
				},
				{
					type: 'primitive',
					table: `${randomExternalCollection}_RANDOM`,
					column: randomJoinNodeField,
					as: `${randomJoinNodeField}_RANDOM`,
				},
				{
					type: 'fn',
					fn: {
						type: 'extractFn',
						fn: 'month',
					},
					table: randomCollection,
					column: `${randomPrimitiveFieldFn}`,
					as: `month_${randomPrimitiveFieldFn}_RANDOM`,
				},
			],
			joins: [
				{
					type: 'join',
					table: randomExternalCollection,
					on: {
						type: 'condition',
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								table: randomCollection,
								column: randomJoinCurrentField,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: `${randomExternalCollection}_RANDOM`,
								column: randomExternalField,
							},
						},
						negate: false,
					},
					as: `${randomExternalCollection}_RANDOM`,
				},
			],
		},
		parameters: [],
		aliasMapping: new Map([
			[`${randomPrimitiveField1}_RANDOM`, [randomPrimitiveFieldAlias1]],
			[`${randomJoinNodeField}_RANDOM`, [randomNestedAlias, randomJoinNodeFieldAlias]],
			[`month_${randomPrimitiveFieldFn}_RANDOM`, [randomPrimitiveFieldFnAlias]],
		]),
		nestedManys: [],
	};

	const result = convertFieldNodes(randomCollection, fields, parameterIndexGenerator());
	expect(result.clauses).toMatchObject(expected.clauses);
	expect(result.parameters).toMatchObject(expected.parameters);
	expect(result.aliasMapping).toMatchObject(expected.aliasMapping);
});

test('primitive, o2m', () => {
	const randomJoinCurrentField = randomIdentifier();
	const randomExternalCollection = randomIdentifier();
	const randomExternalStore = randomIdentifier();
	const randomExternalField = randomIdentifier();
	const randomJoinNodeField = randomIdentifier();
	const randomJoinNodeFieldAlias = randomIdentifier();
	const randomNestedAlias = randomIdentifier();

	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: randomPrimitiveField1,
			alias: randomPrimitiveFieldAlias1,
		},
		{
			type: 'nested-many',
			fields: [
				{
					type: 'primitive',
					field: randomJoinNodeField,
					alias: randomJoinNodeFieldAlias,
				},
			],
			alias: randomNestedAlias,
			meta: {
				type: 'o2m',
				join: {
					local: {
						fields: [randomJoinCurrentField],
					},
					foreign: {
						store: randomExternalStore,
						collection: randomExternalCollection,
						fields: [randomExternalField],
					},
				},
			},
			modifiers: {},
		},
	];

	const expected: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: randomCollection,
					column: randomPrimitiveField1,
					as: `${randomPrimitiveField1}_RANDOM`,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: new Map([[`${randomPrimitiveField1}_RANDOM`, [randomPrimitiveFieldAlias1]]]),
		nestedManys: [
			{
				queryGenerator: expect.any(Function),
				localJoinFields: [randomJoinCurrentField],
				foreignJoinFields: [randomExternalField],
				alias: randomNestedAlias,
			},
		],
	};

	const result = convertFieldNodes(randomCollection, fields, parameterIndexGenerator());
	expect(result).toStrictEqual(expected);
});

test('primitive and o2m field with nested modifiers', () => {
	const randomJoinCurrentField = randomIdentifier();
	const randomExternalCollection = randomIdentifier();
	const randomExternalStore = randomIdentifier();
	const randomExternalField = randomIdentifier();
	const randomJoinNodeField = randomIdentifier();
	const randomJoinNodeFieldAlias = randomIdentifier();
	const randomNestedAlias = randomIdentifier();
	const nestedJoinCurrentField = randomIdentifier();
	const nestedExternalStore = randomIdentifier();
	const nestedExternalCollection = randomIdentifier();
	const nestedForeignIdFields = randomIdentifier();
	const randomLimit = randomInteger(1, 100);
	const compareValue = randomIdentifier();
	const nestedTargetField = randomIdentifier();

	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: randomPrimitiveField1,
			alias: randomPrimitiveFieldAlias1,
		},
		{
			type: 'nested-many',
			fields: [
				{
					type: 'primitive',
					field: randomJoinNodeField,
					alias: randomJoinNodeFieldAlias,
				},
			],
			alias: randomNestedAlias,
			meta: {
				type: 'o2m',
				join: {
					local: {
						fields: [randomJoinCurrentField],
					},
					foreign: {
						store: randomExternalStore,
						collection: randomExternalCollection,
						fields: [randomExternalField],
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
							type: 'nested-one-target',
							field: {
								type: 'primitive',
								field: nestedTargetField,
							},
							meta: {
								type: 'm2o',
								join: {
									local: {
										fields: [nestedJoinCurrentField],
									},
									foreign: {
										store: nestedExternalStore,
										collection: nestedExternalCollection,
										fields: [nestedForeignIdFields],
									},
								},
							},
						},
						compareTo: compareValue,
					},
				},
				limit: {
					type: 'limit',
					value: randomLimit,
				},
			},
		},
	];

	const expected: FieldConversionResult = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: randomCollection,
					column: randomPrimitiveField1,
					as: `${randomPrimitiveField1}_RANDOM`,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: new Map([[`${randomPrimitiveField1}_RANDOM`, [randomPrimitiveFieldAlias1]]]),
		nestedManys: [
			{
				queryGenerator: expect.any(Function),
				localJoinFields: [randomJoinCurrentField],
				foreignJoinFields: [randomExternalField],
				alias: randomNestedAlias,
			},
		],
	};

	const randomPkValue = randomIdentifier();

	const expectedGeneratedQuery: AbstractSqlQuery = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: randomExternalCollection,
					column: randomJoinNodeField,
					as: `${randomJoinNodeField}_RANDOM`,
				},
			],
			from: randomExternalCollection,
			joins: [
				{
					type: 'join',
					table: nestedExternalCollection,
					as: `${nestedExternalCollection}_RANDOM`,
					on: {
						type: 'condition',
						condition: {
							type: 'condition-field',
							compareTo: {
								type: 'primitive',
								column: nestedForeignIdFields,
								table: `${nestedExternalCollection}_RANDOM`,
							},
							operation: 'eq',
							target: {
								type: 'primitive',
								column: nestedJoinCurrentField,
								table: randomExternalCollection,
							},
						},
						negate: false,
					},
				},
			],
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
								table: `${nestedExternalCollection}_RANDOM`,
								column: nestedTargetField,
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
								table: randomExternalCollection,
								column: randomExternalField,
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
		},
		parameters: [compareValue, randomLimit, randomPkValue],
		aliasMapping: new Map([[`${randomJoinNodeField}_RANDOM`, [randomJoinNodeFieldAlias]]]),
		nestedManys: [],
	};

	const result = convertFieldNodes(randomCollection, fields, parameterIndexGenerator());
	expect(result).toStrictEqual(expected);
	expect(result.nestedManys[0]?.queryGenerator([randomPkValue])).toStrictEqual(expectedGeneratedQuery);
});
