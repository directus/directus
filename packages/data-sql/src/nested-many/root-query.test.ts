import type { AbstractQuery } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { expect, test } from 'vitest';
import { getRootQuery } from './root-query.js';

test.todo('get root query', () => {
	const randomRootCollection = randomIdentifier();
	const randomStore = randomIdentifier();
	const randomFieldName0 = randomIdentifier();

	// first relational node
	const collectionToJoin = randomIdentifier();
	const joinField11 = randomIdentifier();
	const joinFieldAlias1 = randomIdentifier();
	const joinField21 = randomIdentifier();
	const relationalKeyField1 = randomIdentifier();
	const collectionToJoinForeignKeyField = randomIdentifier();

	// second, nested relational node
	const collectionToJoin2 = randomIdentifier();
	const joinField12 = randomIdentifier();
	const joinField22 = randomIdentifier();
	const joinFieldAlias2 = randomIdentifier();
	const relationalKeyField2 = randomIdentifier();
	const collectionToJoinForeignKeyField2 = randomIdentifier();

	const query: AbstractQuery = {
		collection: randomRootCollection,
		store: randomStore,
		fields: [
			{
				type: 'primitive',
				field: randomFieldName0,
			},
			{
				type: 'nested-many',
				fields: [
					{
						type: 'primitive',
						field: joinField11,
						alias: joinFieldAlias1,
					},
					{
						type: 'primitive',
						field: joinField21,
					},
					{
						type: 'nested-many',
						fields: [
							{
								type: 'primitive',
								field: joinField12,
								alias: joinFieldAlias2,
							},
							{
								type: 'primitive',
								field: joinField22,
							},
						],
						meta: {
							type: 'o2m',
							join: {
								local: {
									fields: [relationalKeyField2],
								},
								foreign: {
									store: randomStore,
									collection: collectionToJoin2,
									fields: [collectionToJoinForeignKeyField2],
								},
							},
						},
					},
				],
				meta: {
					type: 'o2m',
					join: {
						local: {
							fields: [relationalKeyField1],
						},
						foreign: {
							store: randomStore,
							collection: collectionToJoin,
							fields: [collectionToJoinForeignKeyField],
						},
					},
				},
			},
		],
	};

	const expected = {
		collection: randomRootCollection,
		store: randomStore,
		fields: [
			{
				type: 'primitive',
				field: randomFieldName0,
			},
			{
				type: 'primitive',
				field: relationalKeyField1,
			},
		],
	};

	const res = getRootQuery(query);
	expect(res).toEqual(expected);
});
