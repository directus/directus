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

// random user inputs for root fields
const rootCollection = randomIdentifier();
const dataStore = randomIdentifier();
const firstField = randomIdentifier();
const firstFieldId = randomIdentifier();

// random user input and meta for o2m

test('nested with local fields', async () => {
	const secondField = randomIdentifier();
	const secondFieldId = randomIdentifier();
	const secondFieldAlias = randomIdentifier();

	const query: AbstractQuery = {
		root: true,
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

	/* @TODO randomize the mocked return values */
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce({
		// @ts-ignore a promise is normally been returned
		client: null,

		stream: new ReadableStream({
			start(controller) {
				const mockedData = [
					{
						[firstFieldId]: 937,
						[secondFieldId]: 'lorem ipsum',
					},
					{
						[firstFieldId]: 1342,
						[secondFieldId]: 'ipsum dapsum',
					},
				];

				mockedData.forEach((chunk) => controller.enqueue(chunk));
			},
		}),
	});

	const readableStream = await driver.query(query);
	const actualResult: Record<string, any>[] = [];

	for await (const chunk of readableStream) {
		actualResult.push(chunk);

		// this is a hot fix. for some reason the mocked db response stream does not close properly
		if (actualResult.length === 2) {
			break;
		}
	}

	const expectedResult = [
		{
			[firstField]: 937,
			[secondFieldAlias]: 'lorem ipsum',
		},
		{
			[firstField]: 1342,
			[secondFieldAlias]: 'ipsum dapsum',
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
		root: true,
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

	/* @TODO randomize the mocked return values */
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce({
		// @ts-ignore a promise is normally been returned
		client: null,
		stream: new ReadableStream({
			start(controller) {
				const mockedData = [
					{
						[firstFieldId]: 937,
						[joinField1Id]: 42,
						[joinField2Id]: true,
					},
					{
						[firstFieldId]: 1342,
						[joinField1Id]: 26,
						[joinField2Id]: true,
					},
				];

				mockedData.forEach((chunk) => controller.enqueue(chunk));
			},
		}),
	});

	const readableStream = await driver.query(query);
	const actualResult: Record<string, any>[] = [];

	for await (const chunk of readableStream) {
		actualResult.push(chunk);

		// this is a hot fix. for some reason the mocked db response stream does not close properly
		if (actualResult.length === 2) {
			break;
		}
	}

	const expectedResult = [
		{
			[firstField]: 937,
			[collectionToJoin]: {
				[joinField1Alias]: 42,
				[joinField2]: true,
			},
		},
		{
			[firstField]: 1342,
			[collectionToJoin]: {
				[joinField1Alias]: 26,
				[joinField2]: true,
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
		root: true,
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

	/* @TODO randomize the mocked return values */
	vi.spyOn(driver, 'getDataFromSource').mockReturnValueOnce({
		// @ts-ignore a promise is normally been returned
		client: null,
		stream: new ReadableStream({
			start(controller) {
				const mockedData = [
					{
						[firstFieldId]: 937,
						[joinField2IdM]: true,
						[joinField1IdM]: 27,
					},
					{
						[firstFieldId]: 937,
						[joinField2IdM]: false,
						[joinField1IdM]: 28,
					},
					{
						[firstFieldId]: 1342,
						[joinField1IdM]: 26,
						[joinField2IdM]: null,
						[joinField1IdM]: null,
					},
				];

				mockedData.forEach((chunk) => controller.enqueue(chunk));
			},
		}),
	});

	const readableStream = await driver.query(query);
	const actualResult: Record<string, any>[] = [];

	for await (const chunk of readableStream) {
		actualResult.push(chunk);

		// this is a hot fix. for some reason the mocked db response stream does not close properly
		if (actualResult.length === 2) {
			break;
		}
	}

	const expectedResult = [
		{
			[firstField]: 937,
			[collectionToJoin2]: [
				{
					[joinField1AliasM]: 27,
					[joinField2m]: true,
				},
				{
					[joinField1AliasM]: 28,
					[joinField2m]: false,
				},
			],
		},
		{
			[firstField]: 1342,
			[collectionToJoin2]: [],
		},
	];

	expect(actualResult).toEqual(expectedResult);
});
