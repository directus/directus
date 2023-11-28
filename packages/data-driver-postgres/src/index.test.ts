/**
 * Package tests for the driver.
 * Database responses are mocked and '@directus/data-sql' is partially mocked to know the generated aliases.
 */

import type { AbstractQuery } from '@directus/data';
import { convertQuery, readToEnd } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';
import { ReadableStream } from 'node:stream/web';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import DataDriverPostgres from './index.js';

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

function getMockedStream(data: Record<string, unknown>[]): ReadableStream<Record<string, unknown>> {
	return new ReadableStream({
		start(controller) {
			data.forEach((chunk) => controller.enqueue(chunk));
			controller.close();
		},
	});
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

	vi.mocked(convertQuery).mockReturnValueOnce({
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
	vi.spyOn(driver, 'getDataFromSource').mockResolvedValueOnce(getMockedStream(mockedData));

	const readableStream = await driver.query(query);
	const actualResult = await readToEnd(readableStream);
	await driver.destroy();

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

	vi.mocked(convertQuery).mockReturnValueOnce({
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
	vi.spyOn(driver, 'getDataFromSource').mockResolvedValueOnce(getMockedStream(mockedData));

	const readableStream = await driver.query(query);
	const actualResult = await readToEnd(readableStream);
	await driver.destroy();

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

test('nested o2m field', async () => {
	const localDesiredField = randomIdentifier();
	const localDesiredFieldId = randomIdentifier();

	const localPkField = randomIdentifier();
	const localPkFieldId = randomIdentifier();

	const foreignTable = randomIdentifier();

	const foreignField1 = randomIdentifier();
	const foreignField1Id = randomIdentifier();
	const foreignField1Alias = randomIdentifier();

	const foreignField2 = randomIdentifier();
	const foreignField2Id = randomIdentifier();

	const localRelationalField = randomIdentifier();
	const foreignIdField = randomIdentifier();

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
	// @todo because of this we should make the generation of aliases deterministic

	vi.mocked(convertQuery).mockReturnValueOnce({
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
			[localPkFieldId, [localPkField]],
		]),
		nestedManys: [
			{
				queryGenerator: (identifierValues) => ({
					clauses: {
						select: [
							{
								type: 'primitive',
								table: foreignTable,
								column: foreignField1,
								as: foreignField1Id,
								alias: foreignField1Alias,
							},
							{
								type: 'primitive',
								table: foreignTable,
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
						[foreignField1Id, [foreignField1Alias]],
						[foreignField2Id, [foreignField2]],
					]),
					nestedManys: [],
				}),
				localJoinFields: [localRelationalField],
				foreignJoinFields: [foreignIdField],
				alias: foreignTable,
			},
		],
	});

	const driver = new DataDriverPostgres({
		connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
	});

	// define database response mocks
	// the first query gets all the IDs of the root collection
	// here we assume to get two rows back, each containing the fields specified by the user and the primary key field value

	const localDesiredFieldResult1 = randomIdentifier();
	const localDesiredFieldResult2 = randomIdentifier();
	const localPkFieldValue1 = randomIdentifier();
	const localPkFieldValue2 = randomIdentifier();

	const mockedRootData = [
		{
			[localDesiredFieldId]: localDesiredFieldResult1,
			[localPkFieldId]: localPkFieldValue1,
		},
		{
			[localDesiredFieldId]: localDesiredFieldResult2,
			[localPkFieldId]: localPkFieldValue2,
		},
	];

	// then for each resulting row, the driver queries the nested collection with the IDs of the root collection

	// we assume that the first row has two associated rows in the nested collection
	// and the second row has one associated row in the nested collection

	const foreignField1Value1 = randomIdentifier();
	const foreignField2Value1 = randomIdentifier();
	const foreignField1Value2 = randomIdentifier();
	const foreignField2Value2 = randomIdentifier();

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

	const foreignField1Value3 = randomIdentifier();
	const foreignField2Value3 = randomIdentifier();

	const mockedDataFromNestedCollection2 = [
		{
			[foreignField1Id]: foreignField1Value3,
			[foreignField2Id]: foreignField2Value3,
		},
	];

	// @ts-ignore
	vi.spyOn(driver, 'getDataFromSource')
		.mockResolvedValueOnce(getMockedStream(mockedRootData))
		.mockResolvedValueOnce(getMockedStream(mockedDataFromNestedCollection1))
		.mockResolvedValueOnce(getMockedStream(mockedDataFromNestedCollection2));

	const readableStream = await driver.query(query);
	const actualResult = await readToEnd(readableStream);
	await driver.destroy();

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

	expect(actualResult).toStrictEqual(expectedResult);
});
