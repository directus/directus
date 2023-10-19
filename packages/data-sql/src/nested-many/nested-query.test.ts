import { expect, test, describe } from 'vitest';
import { convertManyNodeToAbstractQuery } from './nested-query.js';
import { randomIdentifier } from '@directus/random';
import type { AbstractQuery, AbstractQueryFieldNodeNestedMany } from '@directus/data';

describe('create abstract query with filter for sub query', () => {
	test('for single key relation', () => {
		const randomStore = randomIdentifier();
		const collectionToJoin = randomIdentifier();
		const joinField11 = randomIdentifier();
		const joinFieldAlias = randomIdentifier();
		const joinField2 = randomIdentifier();
		const relationalKeyFieldCurrent = randomIdentifier();
		const relationalKeyFieldForeign = randomIdentifier();

		const node: AbstractQueryFieldNodeNestedMany = {
			type: 'nested-many',
			fields: [
				{
					type: 'primitive',
					field: joinField11,
					alias: joinFieldAlias,
				},
				{
					type: 'primitive',
					field: joinField2,
				},
			],
			meta: {
				type: 'o2m',
				join: {
					internal: {
						fields: [relationalKeyFieldCurrent],
					},
					external: {
						store: randomStore,
						collection: collectionToJoin,
						fields: [relationalKeyFieldForeign],
					},
				},
			},
		};

		const randomAlias1 = randomIdentifier();
		const randomAlias2 = randomIdentifier();
		const randomValue1 = randomIdentifier();
		const randomValue2 = randomIdentifier();
		const localKeyValue = randomIdentifier();

		const exampleChunk = {
			[randomAlias1]: randomValue1,
			[randomAlias2]: randomValue2,
			[relationalKeyFieldForeign]: localKeyValue,
		};

		const res = convertManyNodeToAbstractQuery(node, exampleChunk);

		const expected: AbstractQuery = {
			store: randomStore,
			collection: collectionToJoin,
			fields: [
				{
					type: 'primitive',
					field: joinField11,
					alias: joinFieldAlias,
				},
				{
					type: 'primitive',
					field: joinField2,
				},
			],
			modifiers: {
				filter: {
					type: 'condition',
					condition: {
						type: 'condition-string',
						target: {
							type: 'primitive',
							field: relationalKeyFieldForeign,
						},
						operation: 'eq',
						compareTo: localKeyValue,
					},
				},
			},
		};

		expect(res).toStrictEqual(expected);
	});
});
