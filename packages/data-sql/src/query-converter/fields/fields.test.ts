import { expect, test, vi, afterAll, beforeEach } from 'vitest';
import { convertFieldNodes, type Result } from './fields.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
import type { AbstractQueryFieldNode } from '@directus/data';
import { randomIdentifier } from '@directus/random';

afterAll(() => {
	vi.restoreAllMocks();
});

vi.mock('../../orm/create-unique-alias.js', () => ({
	createUniqueAlias: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

let randomPrimitiveField1: string;
let randomPrimitiveField2: string;
let randomCollection: string;

beforeEach(() => {
	randomPrimitiveField1 = randomIdentifier();
	randomPrimitiveField2 = randomIdentifier();
	randomCollection = randomIdentifier();
});

test('primitives only', () => {
	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: randomPrimitiveField1,
		},
		{
			type: 'primitive',
			field: randomPrimitiveField2,
		},
	];

	const expected: Result = {
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
			[`${randomPrimitiveField1}_RANDOM`, [randomPrimitiveField1]],
			[`${randomPrimitiveField2}_RANDOM`, [randomPrimitiveField2]],
		]),
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
		},
		{
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: randomPrimitiveField2,
		},
	];

	const expected: Result = {
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
			[`${randomPrimitiveField1}_RANDOM`, [randomPrimitiveField1]],
			[`month_${randomPrimitiveField2}_RANDOM`, [randomPrimitiveField2]],
		]),
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
	const randomPrimitiveFieldFn = randomIdentifier();

	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: randomPrimitiveField1,
		},
		{
			type: 'nested-one',
			fields: [
				{
					type: 'primitive',
					field: randomJoinNodeField,
				},
			],
			meta: {
				type: 'm2o',
				join: {
					current: {
						fields: [randomJoinCurrentField],
					},
					external: {
						store: randomExternalStore,
						collection: randomExternalCollection,
						fields: [randomExternalField],
					},
				},
			},
		},
		{
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: randomPrimitiveFieldFn,
		},
	];

	const idGen = parameterIndexGenerator();

	const expected: Result = {
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
			[`${randomPrimitiveField1}_RANDOM`, [randomPrimitiveField1]],
			[`${randomJoinNodeField}_RANDOM`, [randomExternalCollection, randomJoinNodeField]],
			[`month_${randomPrimitiveFieldFn}_RANDOM`, [randomPrimitiveFieldFn]],
		]),
	};

	const result = convertFieldNodes(randomCollection, fields, idGen);
	expect(result.clauses).toMatchObject(expected.clauses);
	expect(result.parameters).toMatchObject(expected.parameters);
	expect(result.aliasMapping).toMatchObject(expected.aliasMapping);
});
