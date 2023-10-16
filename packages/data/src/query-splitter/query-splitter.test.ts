/**
 * This was also called the query planner.
 */
import type { AbstractQuery } from '@directus/data';
import { expect, test } from 'vitest';
import { extractO2MNodes, type SplitUpQuery } from './query-splitter.js';
import { randomIdentifier } from '@directus/random';

test.todo('extract O2M nodes', () => {
	const randomRootCollection = randomIdentifier();
	const randomNestedCollection = randomIdentifier();
	const randomStore = randomIdentifier();
	const randomFieldName0 = randomIdentifier();

	// m2o random identifiers
	const randomFieldName1 = randomIdentifier();
	const randomCurrentField1 = randomIdentifier();
	const randomExternalField1 = randomIdentifier();

	// o2m random identifiers
	const randomFieldName2 = randomIdentifier();
	const randomCurrentField2 = randomIdentifier();
	const randomExternalField2 = randomIdentifier();

	const query: AbstractQuery = {
		collection: randomRootCollection,
		store: randomStore,
		fields: [
			{
				type: 'primitive',
				field: randomFieldName0,
			},
			{
				type: 'nested-one',
				fields: [
					{
						type: 'primitive',
						field: randomFieldName1,
					},
				],
				meta: {
					type: 'm2o',
					join: {
						current: {
							fields: [randomCurrentField1],
						},
						external: {
							collection: randomNestedCollection,
							fields: [randomExternalField1],
						},
					},
				},
			},
			{
				type: 'nested-many',
				fields: [
					{
						type: 'primitive',
						field: randomFieldName2,
					},
				],
				meta: {
					type: 'o2m',
					join: {
						current: {
							fields: [randomCurrentField2],
						},
						external: {
							collection: randomNestedCollection,
							fields: [randomExternalField2],
						},
					},
				},
			},
		],
	};

	const res = extractO2MNodes(query);

	const expected: SplitUpQuery = {
		rootQuery: {
			collection: randomRootCollection,
			store: randomStore,
			fields: [
				{
					field: randomFieldName0,
					type: 'primitive',
				},
				{
					type: 'nested-one',
					fields: [
						{
							field: randomFieldName1,
							type: 'primitive',
						},
					],
					meta: {
						type: 'm2o',
						join: {
							current: {
								fields: [randomCurrentField1],
							},
							external: {
								collection: randomNestedCollection,
								fields: [randomExternalField1],
							},
						},
					},
				},
			],
		},
		o2mQueries: [
			{
				rootQuery: {
					store: randomStore,
					collection: randomNestedCollection,
					fields: [
						{
							field: randomFieldName2,
							type: 'primitive',
						},
					],
				},
				o2mQueries: [],
			},
		],
	};

	expect(res).toEqual(expected);
});
