import { expect, test, vi, afterAll, beforeEach } from 'vitest';
import { convertFieldNodes, type FieldConversionResult } from './fields.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
import type { AbstractQueryFieldNode } from '@directus/data';
import { randomIdentifier } from '@directus/random';

afterAll(() => {
	vi.restoreAllMocks();
});

vi.mock('../../utils/create-unique-alias.js', () => ({
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
		aliasMapping: [
			{ type: 'root', alias: randomPrimitiveFieldAlias1, column: `${randomPrimitiveField1}_RANDOM` },
			{ type: 'root', alias: randomPrimitiveFieldAlias2, column: `${randomPrimitiveField2}_RANDOM` },
		],
		subQueries: [],
	};

	const idGen = parameterIndexGenerator();
	const result = convertFieldNodes(randomCollection, fields, idGen);
	expect(result).toStrictEqual(expected);
});

test('primitive, fn', () => {
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
		aliasMapping: [
			{ type: 'root', alias: randomPrimitiveFieldAlias1, column: `${randomPrimitiveField1}_RANDOM` },
			{ type: 'root', alias: randomPrimitiveFieldAlias2, column: `month_${randomPrimitiveField2}_RANDOM` },
		],
		subQueries: [],
	};

	const idGen = parameterIndexGenerator();
	const result = convertFieldNodes(randomCollection, fields, idGen);
	expect(result).toStrictEqual(expected);
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
			type: 'nested-single-one',
			fields: [
				{
					type: 'primitive',
					field: randomJoinNodeField,
					alias: randomJoinNodeFieldAlias,
				},
			],
			nesting: {
				type: 'relational-many',

				local: {
					fields: [randomJoinCurrentField],
				},
				foreign: {
					store: randomExternalStore,
					collection: randomExternalCollection,
					fields: [randomExternalField],
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
		aliasMapping: [
			{
				type: 'root',
				alias: randomPrimitiveFieldAlias1,
				column: `${randomPrimitiveField1}_RANDOM`,
			},
			{
				type: 'nested',
				alias: randomNestedAlias,
				children: [{ type: 'root', alias: randomJoinNodeFieldAlias, column: `${randomJoinNodeField}_RANDOM` }],
			},
			{
				type: 'root',
				alias: randomPrimitiveFieldFnAlias,
				column: `month_${randomPrimitiveFieldFn}_RANDOM`,
			},
		],
		subQueries: [],
	};

	const result = convertFieldNodes(randomCollection, fields, parameterIndexGenerator());
	expect(result).toMatchObject(expected);
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
			type: 'nested-single-many',
			fields: [
				{
					type: 'primitive',
					field: randomJoinNodeField,
					alias: randomJoinNodeFieldAlias,
				},
			],
			alias: randomNestedAlias,
			nesting: {
				type: 'relational-many',

				local: {
					fields: [randomJoinCurrentField],
				},
				foreign: {
					store: randomExternalStore,
					collection: randomExternalCollection,
					fields: [randomExternalField],
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
				{
					type: 'primitive',
					table: randomCollection,
					column: randomJoinCurrentField,
					as: `${randomJoinCurrentField}_RANDOM`,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: [
			{
				type: 'root',
				alias: randomPrimitiveFieldAlias1,
				column: `${randomPrimitiveField1}_RANDOM`,
			},
			{
				type: 'sub',
				alias: randomNestedAlias,
				index: 0,
			},
		],
		subQueries: [expect.any(Function)],
	};

	const result = convertFieldNodes(randomCollection, fields, parameterIndexGenerator());
	expect(result).toStrictEqual(expected);
});
