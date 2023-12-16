/**
 * Package tests for the driver.
 * Database responses are mocked and '@directus/data-sql' is partially mocked to know the generated aliases.
 */

import type { AbstractQuery } from '@directus/data';
import { convertQuery, readToEnd, type ConverterResult } from '@directus/data-sql';
import { randomIdentifier } from '@directus/random';
import { ReadableStream } from 'node:stream/web';
import { afterEach, expect, test, vi } from 'vitest';
import DataDriverPostgres from './index.js';

vi.mock('@directus/data-sql', async (importOriginal) => {
	const mod = await importOriginal<typeof import('@directus/data-sql')>();
	return {
		...mod,
		convertQuery: vi.fn(),
	};
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

test('nested with local fields', async () => {
	const rootCollection = randomIdentifier();
	const dataStore = randomIdentifier();
	const firstField = randomIdentifier();
	const firstFieldId = randomIdentifier();
	const firstFieldAlias = randomIdentifier();
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
				alias: firstFieldAlias,
			},
			{
				type: 'primitive',
				field: secondField,
				alias: secondFieldAlias,
			},
		],
		modifiers: {},
	};

	const conversionResult: ConverterResult = {
		rootQuery: {
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
					},
				],
				from: rootCollection,
			},
			parameters: [],
		},
		aliasMapping: [
			{ type: 'root', alias: firstFieldAlias, column: firstFieldId },
			{ type: 'root', alias: secondFieldAlias, column: secondFieldId },
		],
		subQueries: [],
	};

	vi.mocked(convertQuery).mockReturnValueOnce(conversionResult);

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
			[firstFieldAlias]: firstFieldDbResult1,
			[secondFieldAlias]: secondFieldDbResult1,
		},
		{
			[firstFieldAlias]: firstFieldDbResult2,
			[secondFieldAlias]: secondFieldDbResult2,
		},
	];

	expect(actualResult).toEqual(expectedResult);
});

test('nested m2o field', async () => {
	// random user inputs and meta for m2o
	const rootCollection = randomIdentifier();
	const dataStore = randomIdentifier();
	const firstField = randomIdentifier();
	const firstFieldId = randomIdentifier();
	const firstFieldAlias = randomIdentifier();
	const collectionToJoin = randomIdentifier();
	const collectionToJoinId = randomIdentifier();
	const joinField1 = randomIdentifier();
	const joinField1Id = randomIdentifier();
	const joinField1Alias = randomIdentifier();
	const joinField2 = randomIdentifier();
	const joinField2Id = randomIdentifier();
	const joinField2Alias = randomIdentifier();
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
				alias: firstFieldAlias,
			},
			{
				type: 'nested-single-one',
				fields: [
					{
						type: 'primitive',
						field: joinField1,
						alias: joinField1Alias,
					},
					{
						type: 'primitive',
						field: joinField2,
						alias: joinField2Alias,
					},
				],
				nesting: {
					type: 'relational-many',
					local: {
						fields: [foreignKeyField],
					},
					foreign: {
						store: dataStore,
						collection: collectionToJoin,
						fields: [collectionToJoinPrimaryKeyField],
					},
				},
				alias: joinAlias,
			},
		],
		modifiers: {},
	};

	const conversionResult: ConverterResult = {
		rootQuery: {
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
					},
				],
			},
			parameters: [],
		},
		aliasMapping: [
			{
				type: 'root',
				alias: firstFieldAlias,
				column: firstFieldId,
			},
			{
				type: 'nested',
				alias: joinAlias,
				children: [
					{ type: 'root', alias: joinField1Alias, column: joinField1Id },
					{ type: 'root', alias: joinField2Alias, column: joinField2Id },
				],
			},
		],
		subQueries: [],
	};

	vi.mocked(convertQuery).mockReturnValueOnce(conversionResult);

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
			[firstFieldAlias]: firstFieldDbResult1,
			[joinAlias]: {
				[joinField1Alias]: secondFieldDbResult1,
				[joinField2Alias]: thirdFieldDbResult1,
			},
		},
		{
			[firstFieldAlias]: firstFieldDbResult2,
			[joinAlias]: {
				[joinField1Alias]: secondFieldDbResult2,
				[joinField2Alias]: thirdFieldDbResult2,
			},
		},
	];

	expect(actualResult).toEqual(expectedResult);
});

test('nested o2m field', async () => {
	const rootCollection = randomIdentifier();
	const dataStore = randomIdentifier();

	const localDesiredField = randomIdentifier();
	const localDesiredFieldId = randomIdentifier();
	const localDesiredFieldAlias = randomIdentifier();

	const localPkField = randomIdentifier();
	const localPkFieldId = randomIdentifier();
	const localPkFieldAlias = randomIdentifier();

	const foreignTable = randomIdentifier();
	const foreignTableAlias = randomIdentifier();

	const foreignField1 = randomIdentifier();
	const foreignField1Id = randomIdentifier();
	const foreignField1Alias = randomIdentifier();

	const foreignField2 = randomIdentifier();
	const foreignField2Id = randomIdentifier();
	const foreignField2Alias = randomIdentifier();

	const localRelationalField = randomIdentifier();
	const foreignIdField = randomIdentifier();

	const query: AbstractQuery = {
		collection: rootCollection,
		store: dataStore,
		fields: [
			{
				type: 'primitive',
				field: localDesiredField,
				alias: localDesiredFieldAlias,
			},
			{
				type: 'primitive',
				field: localPkField,
				alias: localPkFieldAlias,
			},
			{
				type: 'nested-single-many',
				fields: [
					{
						type: 'primitive',
						field: foreignField1,
						alias: foreignField1Alias,
					},
					{
						type: 'primitive',
						field: foreignField2,
						alias: foreignField2Alias,
					},
				],
				nesting: {
					type: 'relational-many',
					local: {
						fields: [localRelationalField],
					},
					foreign: {
						store: dataStore,
						collection: foreignTable,
						fields: [foreignIdField],
					},
				},
				alias: foreignTableAlias,
				modifiers: {},
			},
		],
		modifiers: {},
	};

	// because we need to know the generated aliases we have to mock the convertQuery result
	// @todo because of this we should make the generation of aliases deterministic

	const conversionResult: ConverterResult = {
		rootQuery: {
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
						as: localPkFieldId,
					},
				],
				from: rootCollection,
				joins: [],
			},
			parameters: [],
		},
		aliasMapping: [
			{ type: 'root', alias: localDesiredFieldAlias, column: localDesiredFieldId },
			{ type: 'root', alias: localPkFieldAlias, column: localPkFieldId },
			{ type: 'sub', alias: foreignTableAlias, index: 0 },
		],
		subQueries: [
			(rootQuery) => ({
				rootQuery: {
					clauses: {
						select: [
							{
								type: 'primitive',
								table: foreignTable,
								column: foreignField1,
								as: foreignField1Id,
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
					parameters: [rootQuery[localRelationalField] as string],
				},
				aliasMapping: [
					{ type: 'root', alias: foreignField1Alias, column: foreignField1Id },
					{ type: 'root', alias: foreignField2Alias, column: foreignField2Id },
				],
				subQueries: [],
			}),
		],
	};

	vi.mocked(convertQuery).mockReturnValueOnce(conversionResult);

	const driver = new DataDriverPostgres({
		connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
	});

	// define database response mocks
	// the first query gets all the IDs of the root collection
	// here we assume to get two rows back, each containing the fields specified by the user and the primary key field value

	const localDesiredFieldValue1 = randomIdentifier();
	const localDesiredFieldValue2 = randomIdentifier();
	const localPkFieldValue1 = randomIdentifier();
	const localPkFieldValue2 = randomIdentifier();
	const localRelationalFieldValue1 = randomIdentifier();
	const localRelationalFieldValue2 = randomIdentifier();

	const mockedRootData = [
		{
			[localDesiredFieldId]: localDesiredFieldValue1,
			[localPkFieldId]: localPkFieldValue1,
			[localRelationalField]: localRelationalFieldValue1,
		},
		{
			[localDesiredFieldId]: localDesiredFieldValue2,
			[localPkFieldId]: localPkFieldValue2,
			[localRelationalField]: localRelationalFieldValue2,
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
			[localDesiredFieldAlias]: localDesiredFieldValue1,
			[localPkFieldAlias]: localPkFieldValue1,
			[foreignTableAlias]: [
				{
					[foreignField1Alias]: foreignField1Value1,
					[foreignField2Alias]: foreignField2Value1,
				},
				{
					[foreignField1Alias]: foreignField1Value2,
					[foreignField2Alias]: foreignField2Value2,
				},
			],
		},
		{
			[localDesiredFieldAlias]: localDesiredFieldValue2,
			[localPkFieldAlias]: localPkFieldValue2,
			[foreignTableAlias]: [
				{
					[foreignField1Alias]: foreignField1Value3,
					[foreignField2Alias]: foreignField2Value3,
				},
			],
		},
	];

	expect(actualResult).toStrictEqual(expectedResult);
});
