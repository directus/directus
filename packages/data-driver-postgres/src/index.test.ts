/**
 * Package tests for the driver.
 * Database responses are mocked and '@directus/data-sql' is partially mocked to know the generated aliases.
 */

import type { AbstractQuery } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import DataDriverPostgres from './index.js';
import { convertQuery } from '@directus/data-sql';
import { ReadableStream } from 'node:stream/web';

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

function getMockedStream(data: Record<string, any>[]): ReadableStream<Record<string, any>> {
	return new ReadableStream({
		start(controller) {
			data.forEach((chunk) => controller.enqueue(chunk));
			controller.close();
		},
	});
}

/**
 * Receives all the data from a given stream.
 */
async function getActualResult(readableStream: ReadableStream<Record<string, any>>): Promise<Record<string, any>[]> {
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
		nestedManys: [],
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
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce(getMockedStream(mockedData));

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
						local: {
							fields: [foreignKeyField],
						},
						foreign: {
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
		nestedManys: [],
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
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce(getMockedStream(mockedData));

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
	const localDesiredField = randomIdentifier();
	const localDesiredFieldId = randomIdentifier();

	const localPkField = randomIdentifier();
	const localPkFieldId = randomIdentifier();

	const foreignTable = 'foreignTable';
	const foreignTableId = 'foreignTableId';

	const foreignField1 = 'foreignField1';
	const foreignField1Id = 'foreignField1Id';
	const foreignField1Alias = 'foreignField1Alias';

	const foreignField2 = 'foreignField2';
	const foreignField2Id = 'foreignField2Id';

	const localRelationalField = 'relationalField';
	const foreignIdField = 'collectionToJoinForeignKeyField';

	const query: AbstractQuery = {
		collection: rootCollection,
		store: dataStore,
		fields: [
			{
				type: 'primitive',
				field: localDesiredField,
			},
			{
				type: 'primitive',
				field: localPkField,
			},
			{
				type: 'nested-many',
				fields: [
					{
						type: 'primitive',
						field: foreignField1,
						alias: foreignField1Alias,
					},
					{
						type: 'primitive',
						field: foreignField2,
					},
				],
				meta: {
					type: 'o2m',
					join: {
						local: {
							fields: [localRelationalField],
						},
						foreign: {
							store: dataStore,
							collection: foreignTable,
							fields: [foreignIdField],
						},
					},
				},
			},
		],
	};

	// because we need to know the generated aliases we have to mock the convertQuery result

	vi.mocked(convertQuery).mockReturnValue({
		clauses: {
			select: [
				{
					type: 'primitive',
					table: rootCollection,
					column: localDesiredField,
					as: localDesiredFieldId,
				},
				{
					type: 'primitive',
					table: rootCollection,
					column: localPkField,
					as: localDesiredFieldId,
				},
			],
			from: rootCollection,
			joins: [],
		},
		parameters: [],
		aliasMapping: new Map([
			[localDesiredFieldId, [localDesiredField]],
			[localPkFieldId, [localPkFieldId]],
		]),
		nestedManys: [
			{
				internalIdentifierFields: [localRelationalField],
				collection: foreignTable,
				externalKeyFields: [foreignIdField],
				alias: foreignTableId,
				queryGenerator: (identifierValues) => ({
					clauses: {
						select: [
							{
								type: 'primitive',
								table: foreignTableId,
								column: foreignField1,
								as: foreignField1Id,
								alias: foreignField1Alias,
							},
							{
								type: 'primitive',
								table: foreignTableId,
								column: foreignField2,
								as: foreignField2Id,
							},
						],
						from: foreignTable,
						where: {
							type: 'condition',
							condition: {
								type: 'condition-string',
								operation: 'eq',
								target: {
									type: 'primitive',
									table: foreignTable,
									column: localRelationalField,
								},
								compareTo: {
									type: 'value',
									parameterIndex: 0,
								},
							},
							negate: false,
						},
					},
					parameters: identifierValues,
					aliasMapping: new Map([
						[foreignField1Id, [foreignTableId, foreignField1Alias]],
						[foreignField2Id, [foreignTableId, foreignField2]],
					]),
					nestedManys: [],
				}),
			},
		],
	});

	const driver = new DataDriverPostgres({
		connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
	});

	// define database response mocks
	// the first query gets all the IDs of the root collection
	// here we assume to get two rows back, each containing the fields specified by the user and the primary key field value

	const localDesiredFieldResult1 = 'randomIdentifier()1';
	const localDesiredFieldResult2 = 'randomIdentifier()2';
	const localPkFieldValue1 = 'randomIdentifier()3';
	const localPkFieldValue2 = 'randomIdentifier()4';

	const mockedRootData = [
		{
			[localDesiredField]: localDesiredFieldResult1,
			[localPkField]: localPkFieldValue1,
		},
		{
			[localDesiredField]: localDesiredFieldResult2,
			[localPkField]: localPkFieldValue2,
		},
	];

	// @ts-ignore
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce(getMockedStream(mockedRootData));

	// then for each resulting row, the driver queries the nested collection with the IDs of the root collection

	// we assume that the first row has two associated rows in the nested collection
	// and the second row has one associated row in the nested collection

	const foreignField1Value1 = 'randomIdentifier()9';
	const foreignField2Value1 = 'randomIdentifier()10';
	const foreignField1Value2 = 'randomIdentifier()11';
	const foreignField2Value2 = 'randomIdentifier()12';

	const mockedDataFromNestedCollection1 = [
		{
			[foreignField1Id]: foreignField1Value1,
			[foreignField2Id]: foreignField2Value1,
		},
		{
			[foreignField1Id]: foreignField1Value2,
			[foreignField2Id]: foreignField2Value2,
		},
	];

	// @ts-ignore
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce(getMockedStream(mockedDataFromNestedCollection1));

	const foreignField1Value3 = 'randomIdentifier()13';
	const foreignField2Value3 = 'randomIdentifier()14';

	const mockedDataFromNestedCollection2 = [
		{
			[foreignField1Id]: foreignField1Value3,
			[foreignField2Id]: foreignField2Value3,
		},
	];

	// @ts-ignore
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce(getMockedStream(mockedDataFromNestedCollection2));

	const readableStream = await driver.query(query);

	// it seems there is no stream coming back from the driver..
	const actualResult = await getActualResult(readableStream);

	console.log('actualResult', actualResult);

	const expectedResult = [
		{
			[localDesiredField]: localDesiredFieldResult1,
			[localPkField]: localPkFieldValue1,
			[foreignTable]: [
				{
					[foreignField1Alias]: foreignField1Value1,
					[foreignField2]: foreignField2Value1,
				},
				{
					[foreignField1Alias]: foreignField1Value2,
					[foreignField2]: foreignField2Value2,
				},
			],
		},
		{
			[localDesiredField]: localDesiredFieldResult2,
			[localPkField]: localPkFieldValue2,
			[foreignTable]: [
				{
					[foreignField1Alias]: foreignField1Value3,
					[foreignField2]: foreignField2Value3,
				},
			],
		},
	];

	expect(actualResult).toEqual(expectedResult);
});
