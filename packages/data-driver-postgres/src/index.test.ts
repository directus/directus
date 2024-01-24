/**
 * Package tests for the driver.
 * Database responses are mocked and '@directus/data-sql' is partially mocked to know the generated aliases.
 */

import type { AbstractQuery } from '@directus/data';
import { readToEnd } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';
import { ReadableStream } from 'node:stream/web';
import { afterEach, expect, test, vi } from 'vitest';
import DataDriverPostgres from './index.js';

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

const driver = new DataDriverPostgres({
	connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
});

test('nested with local fields', async () => {
	const rootTable = randomIdentifier();
	const column1Name = randomIdentifier();
	const column1Alias = randomIdentifier();
	const column2Name = randomIdentifier();
	const column2Alias = randomIdentifier();

	const query: AbstractQuery = {
		collection: rootTable,
		store: randomIdentifier(),
		fields: [
			{
				type: 'primitive',
				field: column1Name,
				alias: column1Alias,
			},
			{
				type: 'primitive',
				field: column2Name,
				alias: column2Alias,
			},
		],
		modifiers: {},
	};

	const column1DbResult1 = randomIdentifier();
	const column1DbResult2 = randomIdentifier();
	const column2DbResult1 = randomIdentifier();
	const column2DbResult2 = randomIdentifier();

	const mockedData = [
		{
			c0: column1DbResult1,
			c1: column2DbResult1,
		},
		{
			c0: column1DbResult2,
			c1: column2DbResult2,
		},
	];

	vi.spyOn(driver, 'getDataFromSource').mockResolvedValueOnce(getMockedStream(mockedData));

	const readableStream = await driver.query(query);
	const actualResult = await readToEnd(readableStream);
	await driver.destroy();

	const expectedResult = [
		{
			[column1Alias]: column1DbResult1,
			[column2Alias]: column2DbResult1,
		},
		{
			[column1Alias]: column1DbResult2,
			[column2Alias]: column2DbResult2,
		},
	];

	expect(actualResult).toEqual(expectedResult);
});

test('nested m2o field', async () => {
	// random user inputs and meta for m2o
	const rootCollection = randomIdentifier();
	const dataStore = randomIdentifier();
	const column1 = randomIdentifier();
	const column1Alias = randomIdentifier();
	const tableToJoin = randomIdentifier();
	const joinColumn1 = randomIdentifier();
	const joinColumn1Alias = randomIdentifier();
	const joinColumn2 = randomIdentifier();
	const joinField2Alias = randomIdentifier();
	const foreignKeyColumn = randomIdentifier();
	const tableToJoinPkColumn = randomIdentifier();
	const joinAlias = randomIdentifier();

	const query: AbstractQuery = {
		collection: rootCollection,
		store: dataStore,
		fields: [
			{
				type: 'primitive',
				field: column1,
				alias: column1Alias,
			},
			{
				type: 'nested-single-one',
				fields: [
					{
						type: 'primitive',
						field: joinColumn1,
						alias: joinColumn1Alias,
					},
					{
						type: 'primitive',
						field: joinColumn2,
						alias: joinField2Alias,
					},
				],
				nesting: {
					type: 'relational-many',
					local: {
						fields: [foreignKeyColumn],
					},
					foreign: {
						store: dataStore,
						collection: tableToJoin,
						fields: [tableToJoinPkColumn],
					},
				},
				alias: joinAlias,
			},
		],
		modifiers: {},
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

	const mockedData = [
		{
			c0: firstFieldDbResult1,
			c1: secondFieldDbResult1,
			c2: thirdFieldDbResult1,
		},
		{
			c0: firstFieldDbResult2,
			c1: secondFieldDbResult2,
			c2: thirdFieldDbResult2,
		},
	];

	vi.spyOn(driver, 'getDataFromSource').mockResolvedValueOnce(getMockedStream(mockedData));

	const readableStream = await driver.query(query);
	const actualResult = await readToEnd(readableStream);
	await driver.destroy();

	const expectedResult = [
		{
			[column1Alias]: firstFieldDbResult1,
			[joinAlias]: {
				[joinColumn1Alias]: secondFieldDbResult1,
				[joinField2Alias]: thirdFieldDbResult1,
			},
		},
		{
			[column1Alias]: firstFieldDbResult2,
			[joinAlias]: {
				[joinColumn1Alias]: secondFieldDbResult2,
				[joinField2Alias]: thirdFieldDbResult2,
			},
		},
	];

	expect(actualResult).toEqual(expectedResult);
});

test('nested o2m field', async () => {
	const rootCollection = randomIdentifier();
	const dataStore = randomIdentifier();
	const localDesiredColumn = randomIdentifier();
	const localDesiredColumnAlias = randomIdentifier();
	const localPkColumn = randomIdentifier();
	const localPkColumnAlias = randomIdentifier();
	const foreignTable = randomIdentifier();
	const foreignTableAlias = randomIdentifier();
	const foreignColumn1 = randomIdentifier();
	const foreignColumn1Alias = randomIdentifier();
	const foreignColumn2 = randomIdentifier();
	const foreignColumn2Alias = randomIdentifier();
	const localRelationalColumn = randomIdentifier();
	const foreignIdColumn = randomIdentifier();

	const query: AbstractQuery = {
		collection: rootCollection,
		store: dataStore,
		fields: [
			{
				type: 'primitive',
				field: localDesiredColumn,
				alias: localDesiredColumnAlias,
			},
			{
				type: 'primitive',
				field: localPkColumn,
				alias: localPkColumnAlias,
			},
			{
				type: 'nested-single-many',
				fields: [
					{
						type: 'primitive',
						field: foreignColumn1,
						alias: foreignColumn1Alias,
					},
					{
						type: 'primitive',
						field: foreignColumn2,
						alias: foreignColumn2Alias,
					},
				],
				nesting: {
					type: 'relational-many',
					local: {
						fields: [localRelationalColumn],
					},
					foreign: {
						store: dataStore,
						collection: foreignTable,
						fields: [foreignIdColumn],
					},
				},
				alias: foreignTableAlias,
				modifiers: {},
			},
		],
		modifiers: {},
	};

	const driver = new DataDriverPostgres({
		connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
	});

	// define database response mocks
	// the first query gets all the IDs of the root collection
	// here we assume to get two rows back, each containing the fields specified by the user and the primary key field value

	const localDesiredColumnValue1 = randomIdentifier();
	const localDesiredColumnValue2 = randomIdentifier();
	const localPkColumnValue1 = randomIdentifier();
	const localPkColumnValue2 = randomIdentifier();
	const localRelationalColumnValue1 = randomIdentifier();
	const localRelationalColumnValue2 = randomIdentifier();

	const mockedRootData = [
		{
			c0: localDesiredColumnValue1,
			c1: localPkColumnValue1,
			c2: localRelationalColumnValue1,
		},
		{
			c0: localDesiredColumnValue2,
			c1: localPkColumnValue2,
			c2: localRelationalColumnValue2,
		},
	];

	// we assume that the first row has two associated rows in the nested collection
	const foreignColumn1Value1 = randomIdentifier();
	const foreignColumn2Value1 = randomIdentifier();
	const foreignColumn1Value2 = randomIdentifier();
	const foreignColumn2Value2 = randomIdentifier();

	const mockedDataFromNestedTable1 = [
		{
			c0: foreignColumn1Value1,
			c1: foreignColumn2Value1,
		},
		{
			c0: foreignColumn1Value2,
			c1: foreignColumn2Value2,
		},
	];

	// and the second row has one associated row in the nested collection
	const foreignColumn1Value3 = randomIdentifier();
	const foreignColumn2Value3 = randomIdentifier();

	const mockedDataFromNestedTable2 = [
		{
			c0: foreignColumn1Value3,
			c1: foreignColumn2Value3,
		},
	];

	vi.spyOn(driver, 'getDataFromSource')
		.mockResolvedValueOnce(getMockedStream(mockedRootData))
		.mockResolvedValueOnce(getMockedStream(mockedDataFromNestedTable1))
		.mockResolvedValueOnce(getMockedStream(mockedDataFromNestedTable2));

	const readableStream = await driver.query(query);
	const actualResult = await readToEnd(readableStream);
	await driver.destroy();

	const expectedResult = [
		{
			[localDesiredColumnAlias]: localDesiredColumnValue1,
			[localPkColumnAlias]: localPkColumnValue1,
			[foreignTableAlias]: [
				{
					[foreignColumn1Alias]: foreignColumn1Value1,
					[foreignColumn2Alias]: foreignColumn2Value1,
				},
				{
					[foreignColumn1Alias]: foreignColumn1Value2,
					[foreignColumn2Alias]: foreignColumn2Value2,
				},
			],
		},
		{
			[localDesiredColumnAlias]: localDesiredColumnValue2,
			[localPkColumnAlias]: localPkColumnValue2,
			[foreignTableAlias]: [
				{
					[foreignColumn1Alias]: foreignColumn1Value3,
					[foreignColumn2Alias]: foreignColumn2Value3,
				},
			],
		},
	];

	expect(actualResult).toStrictEqual(expectedResult);
});
