import { expect, test, vi, afterEach } from 'vitest';
import { convertNodes, type ConvertSelectOutput } from './nodes.js';
import { randomIdentifier } from '@directus/random';
import { parameterIndexGenerator } from '../param-index-generator.js';
import type { AbstractQueryFieldNode } from '@directus/data';

afterEach(() => {
	vi.restoreAllMocks();
});

vi.mock('./create-unique-identifier.js', () => ({
	createUniqueIdentifier: vi.fn().mockImplementation((i) => `${i}_HASHVAL`),
}));

test('Convert nodes', () => {
	const collection = randomIdentifier();
	const randomPrimitiveField = randomIdentifier();
	const randomJoinCurrentField = randomIdentifier();

	const randomExternalCollection = randomIdentifier();
	const randomExternalStore = randomIdentifier();
	const randomExternalField = randomIdentifier();
	const randomJoinNodeField = randomIdentifier();

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
			fn: 'count',
			targetNode: {
				type: 'primitive',
				field: randomPrimitiveField,
			},
		},
	];

	const idGen = parameterIndexGenerator();

	const expected: Partial<ConvertSelectOutput> = {
		select: [
			{
				type: 'primitive',
				table: collection,
				column: randomPrimitiveField,
				as: `${randomPrimitiveField}_HASHVAL`,
			},
			{
				type: 'primitive',
				table: `${randomExternalCollection}_HASHVAL`,
				column: randomJoinNodeField,
				as: `${randomJoinNodeField}_HASHVAL`,
			},
			{
				type: 'fn',
				fn: 'count',
				field: {
					type: 'primitive',
					table: collection,
					column: randomPrimitiveField,
				},
				as: 'count_HASHVAL',
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
							table: `${randomExternalCollection}_HASHVAL`,
							column: randomExternalField,
						},
					},
					negate: false,
				},
				as: `${randomExternalCollection}_HASHVAL`,
			},
		],
		parameters: [],
	};

	expect(convertNodes(collection, nodes, idGen)).toMatchObject(expected);
});
