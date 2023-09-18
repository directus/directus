import { expect, test, vi, afterAll } from 'vitest';
import { convertNodesAndGenerateAliases, type ConvertSelectOutput } from './nodes.js';
import { parameterIndexGenerator } from '../param-index-generator.js';
import type { AbstractQueryFieldNode } from '@directus/data';
import { randomIdentifier } from '@directus/random';

afterAll(() => {
	vi.restoreAllMocks();
});

vi.mock('../../orm/create-unique-identifier.js', () => ({
	createUniqueIdentifier: vi.fn().mockImplementation((i) => `${i}_RANDOM`),
}));

test('convert primitives', () => {
	const nodes: AbstractQueryFieldNode[] = [
		{
			type: 'primitive',
			field: 'randomPrimitiveField1',
		},
		{
			type: 'primitive',
			field: 'randomPrimitiveField2',
		},
	];

	const idGen = parameterIndexGenerator();

	const result = convertNodesAndGenerateAliases('collection', nodes, idGen);

	const expected: Partial<ConvertSelectOutput> = {
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
		parameters: [],
	};

	expect(result.sql).toMatchObject(expected);

	expect(result.aliasMapping).toMatchObject(
		new Map([
			['randomPrimitiveField1_RANDOM', ['randomPrimitiveField1']],
			['randomPrimitiveField2_RANDOM', ['randomPrimitiveField2']],
		])
	);
});

test('convert primitive and fn nodes', () => {
	const nodes: AbstractQueryFieldNode[] = [
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

	const expected: Partial<ConvertSelectOutput> = {
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
		parameters: [],
	};

	const idGen = parameterIndexGenerator();
	const result = convertNodesAndGenerateAliases('collection', nodes, idGen);
	expect(result.sql).toMatchObject(expected);

	expect(result.aliasMapping).toMatchObject(
		new Map([
			['randomPrimitiveField1_RANDOM', ['randomPrimitiveField1']],
			['month_randomPrimitiveField2_RANDOM', ['randomPrimitiveField2']],
		])
	);
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

	const nodes: AbstractQueryFieldNode[] = [
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

	const expected: Partial<ConvertSelectOutput> = {
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
		parameters: [],
	};

	const result = convertNodesAndGenerateAliases(collection, nodes, idGen);

	expect(result.sql).toMatchObject(expected);

	expect(result.aliasMapping).toMatchObject(
		new Map([
			[`${randomPrimitiveField}_RANDOM`, [randomPrimitiveField]],
			[`${randomJoinNodeField}_RANDOM`, [randomExternalCollection, randomJoinNodeField]],
			[`month_${randomPrimitiveFieldFn}_RANDOM`, [randomPrimitiveFieldFn]],
		])
	);
});
