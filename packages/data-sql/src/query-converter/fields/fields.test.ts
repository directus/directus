import { expect, test, vi, afterAll } from 'vitest';
import { convertFieldNodes, type Result } from './fields.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
import type { AbstractQueryFieldNode } from '@directus/data';
import { randomIdentifier } from '@directus/random';

afterAll(() => {
	vi.restoreAllMocks();
});

vi.mock('../../response-converter/orm/create-unique-identifier.js', () => ({
	createUniqueIdentifier: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

test('convert primitives', () => {
	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: 'randomPrimitiveField1',
		},
		{
			type: 'primitive',
			field: 'randomPrimitiveField2',
		},
	];

	const expected: Result = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: 'collection',
					column: 'randomPrimitiveField1',
					as: `${'randomPrimitiveField1'}_RANDOM`,
				},
				{
					type: 'primitive',
					table: 'collection',
					column: 'randomPrimitiveField2',
					as: `${'randomPrimitiveField2'}_RANDOM`,
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: new Map([
			[`${'randomPrimitiveField1'}_RANDOM`, ['randomPrimitiveField1']],
			[`${'randomPrimitiveField2'}_RANDOM`, ['randomPrimitiveField2']],
		]),
	};

	const idGen = parameterIndexGenerator();
	const result = convertFieldNodes('collection', fields, idGen);
	expect(result.clauses).toMatchObject(expected.clauses);
	expect(result.parameters).toMatchObject(expected.parameters);
	expect(result.aliasMapping).toMatchObject(expected.aliasMapping);
});

test('convert primitive and fn nodes', () => {
	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: 'randomPrimitiveField1',
		},
		{
			type: 'fn',
			fn: {
				type: 'extractFn',
				fn: 'month',
			},
			field: 'randomPrimitiveField2',
		},
	];

	const expected: Result = {
		clauses: {
			select: [
				{
					type: 'primitive',
					table: 'collection',
					column: 'randomPrimitiveField1',
					as: 'randomPrimitiveField1_RANDOM',
				},
				{
					type: 'fn',
					fn: {
						type: 'extractFn',
						fn: 'month',
					},
					table: 'collection',
					column: 'randomPrimitiveField2',
					as: 'month_randomPrimitiveField2_RANDOM',
				},
			],
			joins: [],
		},
		parameters: [],
		aliasMapping: new Map([
			['randomPrimitiveField1_RANDOM', ['randomPrimitiveField1']],
			['month_randomPrimitiveField2_RANDOM', ['randomPrimitiveField2']],
		]),
	};

	const idGen = parameterIndexGenerator();
	const result = convertFieldNodes('collection', fields, idGen);
	expect(result.clauses).toMatchObject(expected.clauses);
	expect(result.parameters).toMatchObject(expected.parameters);
	expect(result.aliasMapping).toMatchObject(expected.aliasMapping);
});

test('Convert nodes', () => {
	const collection = randomIdentifier();
	const randomPrimitiveField = randomIdentifier();
	const randomJoinCurrentField = randomIdentifier();
	const randomExternalCollection = randomIdentifier();
	const randomExternalStore = randomIdentifier();
	const randomExternalField = randomIdentifier();
	const randomJoinNodeField = randomIdentifier();
	const randomPrimitiveFieldFn = randomIdentifier();

	const fields: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: randomPrimitiveField,
		},
		{
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
			nodes: [
				{
					type: 'primitive',
					field: randomJoinNodeField,
				},
			],
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
					table: collection,
					column: randomPrimitiveField,
					as: `${randomPrimitiveField}_RANDOM`,
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
					table: collection,
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
								table: collection,
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
			[`${randomPrimitiveField}_RANDOM`, [randomPrimitiveField]],
			[`${randomJoinNodeField}_RANDOM`, [randomExternalCollection, randomJoinNodeField]],
			[`month_${randomPrimitiveFieldFn}_RANDOM`, [randomPrimitiveFieldFn]],
		]),
	};

	const result = convertFieldNodes(collection, fields, idGen);
	expect(result.clauses).toMatchObject(expected.clauses);
	expect(result.parameters).toMatchObject(expected.parameters);
	expect(result.aliasMapping).toMatchObject(expected.aliasMapping);
});
