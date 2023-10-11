/**
 * Package tests for the driver.
 * Database responses are mocked and '@directus/data-sql' is partially mocked to know the generated aliases.
 */

import type { AbstractQuery } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { expect, test, vi } from 'vitest';
import DataDriverPostgres from './index.js';
import { convertQuery } from '@directus/data-sql';

vi.mock('@directus/data-sql', async (importOriginal) => {
	const mod = (await importOriginal()) as any;

	return {
		...mod,
		convertQuery: vi.fn(),
	};
});

function getSteamForMock(data: Record<string, any>[]) {
	return {
		client: null,
		stream: new ReadableStream({
			start(controller) {
				data.forEach((chunk: any) => controller.enqueue(chunk));
			},
		}),
	};
}

/**
 * Receives all the data from a given stream.
 */
async function getActualResult(readableStream: any) {
	const actualResult: Record<string, any>[] = [];

	for await (const chunk of readableStream) {
		actualResult.push(chunk);

		// this is a hot fix. for some reason the mocked db response stream does not close properly
		if (actualResult.length === 2) {
			break;
		}
	}

	return actualResult;
}

// random user inputs for stuff which is used by all tests
const rootCollection = randomIdentifier();
const dataStore = randomIdentifier();
const firstField = randomIdentifier();
const firstFieldId = randomIdentifier();

test('nested with local fields', async () => {
	const secondField = randomIdentifier();
	const secondFieldId = randomIdentifier();
	const secondFieldAlias = randomIdentifier();

	const query: AbstractQuery = {
		collection: rootCollection,
		store: dataStore,
		fields: [
			{
				type: 'primitive',
				field: firstField,
			},
			{
				type: 'primitive',
				field: secondField,
				alias: secondFieldAlias,
			},
		],
	};

	vi.mocked(convertQuery).mockReturnValue({
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
					as: firstFieldId,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: secondField,
					as: secondFieldId,
					alias: secondFieldAlias,
				},
			],
			from: rootCollection,
		},
		parameters: [],
		aliasMapping: new Map([
			[firstFieldId, [firstField]],
			[secondFieldId, [secondFieldAlias]],
		]),
	});

	const driver = new DataDriverPostgres({
		connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
	});

	const fistFieldDbResult1 = randomIdentifier();
	const fistFieldDbResult2 = randomIdentifier();
	const secondFieldDbResult1 = randomIdentifier();
	const secondFieldDbResult2 = randomIdentifier();

	const mockedData = [
		{
			[firstFieldId]: fistFieldDbResult1,
			[secondFieldId]: secondFieldDbResult1,
		},
		{
			[firstFieldId]: fistFieldDbResult2,
			[secondFieldId]: secondFieldDbResult2,
		},
	];

	// @ts-ignore
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce(getSteamForMock(mockedData));

	const readableStream = await driver.query(query);
	const actualResult = await getActualResult(readableStream);

	const expectedResult = [
		{
			[firstField]: fistFieldDbResult1,
			[secondFieldAlias]: secondFieldDbResult1,
		},
		{
			[firstField]: fistFieldDbResult2,
			[secondFieldAlias]: secondFieldDbResult2,
		},
	];

	expect(actualResult).toEqual(expectedResult);
});

test('nested m2o field', async () => {
	// random user inputs and meta for m2o
	const collectionToJoin = randomIdentifier();
	const collectionToJoinId = randomIdentifier();
	const joinField1 = randomIdentifier();
	const joinField1Id = randomIdentifier();
	const joinField1Alias = randomIdentifier();
	const joinField2 = randomIdentifier();
	const joinField2Id = randomIdentifier();
	const fk = randomIdentifier();
	const foreignPk = randomIdentifier();
	const joinAlias = randomIdentifier();

	const query: AbstractQuery = {
		collection: rootCollection,
		store: dataStore,
		fields: [
			{
				type: 'primitive',
				field: firstField,
			},
			{
				type: 'nested-one',
				fields: [
					{
						type: 'primitive',
						field: joinField1,
						alias: joinField1Alias,
					},
					{
						type: 'primitive',
						field: joinField2,
					},
				],
				meta: {
					type: 'm2o',
					join: {
						current: {
							fields: [fk],
						},
						external: {
							store: dataStore,
							collection: collectionToJoin,
							fields: [foreignPk],
						},
					},
				},
				alias: joinAlias,
			},
		],
	};

	vi.mocked(convertQuery).mockReturnValue({
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
					as: firstFieldId,
				},
				{
					type: 'primitive',
					table: collectionToJoinId,
					column: joinField1,
					as: joinField1Id,
					alias: joinField1Alias,
				},
				{
					type: 'primitive',
					table: collectionToJoinId,
					column: joinField2,
					as: joinField2Id,
				},
			],
			from: rootCollection,
			joins: [
				{
					type: 'join',
					table: collectionToJoin,
					as: collectionToJoinId,
					on: {
						type: 'condition',
						negate: false,
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								table: rootCollection,
								column: fk,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: collectionToJoinId,
								column: foreignPk,
							},
						},
					},
					alias: joinAlias,
				},
			],
		},
		parameters: [],
		aliasMapping: new Map([
			[firstFieldId, [firstField]],
			[joinField1Id, [collectionToJoin, joinField1Alias]],
			[joinField2Id, [collectionToJoin, joinField2]],
		]),
	});

	const driver = new DataDriverPostgres({
		connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
	});

	const firstFieldDbResult1 = randomIdentifier();
	const firstFieldDbResult2 = randomIdentifier();
	const secondFieldDbResult1 = randomIdentifier();
	const secondFieldDbResult2 = randomIdentifier();
	const thirdFieldDbResult1 = randomIdentifier();
	const thirdFieldDbResult2 = randomIdentifier();

	const mockedData = [
		{
			[firstFieldId]: firstFieldDbResult1,
			[joinField1Id]: secondFieldDbResult1,
			[joinField2Id]: thirdFieldDbResult1,
		},
		{
			[firstFieldId]: firstFieldDbResult2,
			[joinField1Id]: secondFieldDbResult2,
			[joinField2Id]: thirdFieldDbResult2,
		},
	];

	// @ts-ignore
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce(getSteamForMock(mockedData));

	const readableStream = await driver.query(query);
	const actualResult = await getActualResult(readableStream);

	const expectedResult = [
		{
			[firstField]: firstFieldDbResult1,
			[collectionToJoin]: {
				[joinField1Alias]: secondFieldDbResult1,
				[joinField2]: thirdFieldDbResult1,
			},
		},
		{
			[firstField]: firstFieldDbResult2,
			[collectionToJoin]: {
				[joinField1Alias]: secondFieldDbResult2,
				[joinField2]: thirdFieldDbResult2,
			},
		},
	];

	expect(actualResult).toEqual(expectedResult);
});

test.skip('nested o2m field', async () => {
	const collectionToJoin2 = randomIdentifier();
	const collectionToJoin2Id = randomIdentifier();
	const joinField1m = randomIdentifier();
	const joinField1IdM = randomIdentifier();
	const joinField1AliasM = randomIdentifier();
	const joinField2m = randomIdentifier();
	const joinField2IdM = randomIdentifier();
	const fkM = randomIdentifier();
	const foreignPkm = randomIdentifier();
	const joinAliasM = randomIdentifier();

	const query: AbstractQuery = {
		collection: rootCollection,
		store: dataStore,
		fields: [
			{
				type: 'primitive',
				field: firstField,
			},
			{
				type: 'nested-many',
				fields: [
					{
						type: 'primitive',
						field: joinField1m,
						alias: joinField1AliasM,
					},
					{
						type: 'primitive',
						field: joinField2m,
					},
				],
				meta: {
					type: 'o2m',
					join: {
						current: {
							fields: [fkM],
						},
						external: {
							store: dataStore,
							collection: collectionToJoin2,
							fields: [foreignPkm],
						},
					},
				},
			},
		],
	};

	vi.mocked(convertQuery).mockReturnValue({
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: firstField,
					as: firstFieldId,
				},
				{
					type: 'primitive',
					table: collectionToJoin2Id,
					column: joinField1m,
					as: joinField2IdM,
					alias: joinField1AliasM,
				},
				{
					type: 'primitive',
					table: collectionToJoin2Id,
					column: joinField2m,
					as: joinField2IdM,
				},
			],
			from: rootCollection,
			joins: [
				{
					type: 'join',
					table: collectionToJoin2,
					as: collectionToJoin2Id,
					on: {
						type: 'condition',
						negate: false,
						condition: {
							type: 'condition-field',
							target: {
								type: 'primitive',
								table: rootCollection,
								column: fkM,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: collectionToJoin2Id,
								column: foreignPkm,
							},
						},
					},
					alias: joinAliasM,
				},
			],
		},
		parameters: [],
		aliasMapping: new Map([
			[firstFieldId, [firstField]],
			[joinField1IdM, [collectionToJoin2, joinField2m]],
			[joinField2IdM, [collectionToJoin2, joinField2m]],
		]),
	});

	const driver = new DataDriverPostgres({
		connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
	});

	const firstFieldDbResult1 = randomIdentifier();
	const firstFieldDbResult2 = randomIdentifier();
	const secondFieldDbResult1 = randomIdentifier();
	const secondFieldDbResult2 = randomIdentifier();
	const thirdFieldDbResult1 = randomIdentifier();
	const thirdFieldDbResult2 = randomIdentifier();

	/*
	 * this database result mock shows two o2m relations.
	 * the first one has two 'many' parts, the second one has none 'many' part.
	 * but the second one will get printed anyways since it's the db was queried with a LEFT JOIN.
	 */
	const mockedData = [
		{
			[firstFieldId]: firstFieldDbResult1, // the 'one' part, same value as the next one
			[joinField2IdM]: secondFieldDbResult1, // a field from the 'many' part.
			[joinField1IdM]: thirdFieldDbResult1, // another field from the 'many' part
		},
		{
			[firstFieldId]: firstFieldDbResult1, // the 'one' part, same as the previous one
			[joinField2IdM]: secondFieldDbResult2, // this is a field from the 'many' part, but it's different value as above but for the same 'one' part
			[joinField1IdM]: thirdFieldDbResult2, // another field from the 'many' part
		},
		{
			[firstFieldId]: firstFieldDbResult2, // the 'one' part, now without any 'many' part
			[joinField1IdM]: null, // there is no relation to the desired LEFT JOINed table, so both field values are null
			[joinField2IdM]: null, // also null because there is no relation
		},
	];

	// @ts-ignore
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce(getSteamForMock(mockedData));

	const readableStream = await driver.query(query);
	const actualResult = getActualResult(readableStream);

	const expectedResult = [
		{
			[firstField]: firstFieldDbResult1,
			[collectionToJoin2]: [
				{
					[joinField1AliasM]: secondFieldDbResult1,
					[joinField2m]: thirdFieldDbResult1,
				},
				{
					[joinField1AliasM]: secondFieldDbResult2,
					[joinField2m]: thirdFieldDbResult2,
				},
			],
		},
		{
			[firstField]: firstFieldDbResult2,
			[collectionToJoin2]: [],
		},
	];

	expect(actualResult).toEqual(expectedResult);
});
