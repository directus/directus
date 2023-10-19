/**
 * Package tests for the driver.
 * Database responses are mocked and '@directus/data-sql' is partially mocked to know the generated aliases.
 */

import type { AbstractQuery } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import DataDriverPostgres from './index.js';
import { convertQuery } from '@directus/data-sql';

beforeEach(() => {
	vi.mock('@directus/data-sql', async (importOriginal) => {
		const mod = (await importOriginal()) as any;

		return {
			...mod,
			convertQuery: vi.fn(),
		};
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});

function getStreamForMock(data: Record<string, any>[]) {
	return {
		client: null,
		stream: new ReadableStream({
			start(controller) {
				data.forEach((chunk: any) => controller.enqueue(chunk));

				controller.close();
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

	const firstFieldDbResult1 = randomIdentifier();
	const firstFieldDbResult2 = randomIdentifier();
	const secondFieldDbResult1 = randomIdentifier();
	const secondFieldDbResult2 = randomIdentifier();

	const mockedData = [
		{
			[firstFieldId]: firstFieldDbResult1,
			[secondFieldId]: secondFieldDbResult1,
		},
		{
			[firstFieldId]: firstFieldDbResult2,
			[secondFieldId]: secondFieldDbResult2,
		},
	];

	// @ts-ignore
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce(getStreamForMock(mockedData));

	const readableStream = await driver.query(query);
	const actualResult = await getActualResult(readableStream);

	const expectedResult = [
		{
			[firstField]: firstFieldDbResult1,
			[secondFieldAlias]: secondFieldDbResult1,
		},
		{
			[firstField]: firstFieldDbResult2,
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
	const foreignKeyField = randomIdentifier();
	const collectionToJoinPrimaryKeyField = randomIdentifier();
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
							fields: [foreignKeyField],
						},
						external: {
							store: dataStore,
							collection: collectionToJoin,
							fields: [collectionToJoinPrimaryKeyField],
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
								column: foreignKeyField,
							},
							operation: 'eq',
							compareTo: {
								type: 'primitive',
								table: collectionToJoinId,
								column: collectionToJoinPrimaryKeyField,
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
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce(getStreamForMock(mockedData));

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

test.todo('nested o2m field', async () => {
	const collectionToJoin = randomIdentifier();
	const joinField1 = randomIdentifier();
	const joinField1Alias = randomIdentifier();
	const joinField2 = randomIdentifier();
	const primaryKeyField = randomIdentifier();
	const collectionToJoinForeignKeyField = randomIdentifier();

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
						field: joinField1,
						alias: joinField1Alias,
					},
					{
						type: 'primitive',
						field: joinField2,
					},
				],
				meta: {
					type: 'o2m',
					join: {
						current: {
							fields: [primaryKeyField],
						},
						external: {
							store: dataStore,
							collection: collectionToJoin,
							fields: [collectionToJoinForeignKeyField],
						},
					},
				},
			},
		],
	};

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
	 * @TODO mock the database responses.
	 * One mock for o part query, and multiple mocks for the m part.
	 */

	const readableStream = await driver.query(query);
	const actualResult = getActualResult(readableStream);

	const expectedResult = [
		{
			[firstField]: firstFieldDbResult1,
			[collectionToJoin]: [
				{
					[joinField1Alias]: secondFieldDbResult1,
					[joinField2]: thirdFieldDbResult1,
				},
				{
					[joinField1Alias]: secondFieldDbResult2,
					[joinField2]: thirdFieldDbResult2,
				},
			],
		},
		{
			[firstField]: firstFieldDbResult2,
			[collectionToJoin]: [],
		},
	];

	expect(actualResult).toEqual(expectedResult);
});
