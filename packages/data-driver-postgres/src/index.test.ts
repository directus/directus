import type { AbstractQuery } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { expect, test, describe, vi, afterEach } from 'vitest';
import DataDriverPostgres from './index.js';
import type { AbstractSqlQuery } from '@directus/data-sql';

afterEach(() => {
	vi.restoreAllMocks();
});

// random user inputs for root fields
const rootCollection = randomIdentifier();
const dataStore = randomIdentifier();
const firstField = randomIdentifier();
const firstFieldId = randomIdentifier();
const secondField = randomIdentifier();
const secondFieldId = randomIdentifier();
const secondFieldAlias = randomIdentifier();

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

// random user input and meta for o2m
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

describe('querying the driver', () => {
	test('test', async () => {
		/**
		 * the function 'convertToAbstractSqlQueryAndGenerateAliases' needs to me mocked.
		 * Otherwise we wouldn't know the generated aliases and hence the db response.
		 */
		vi.mock('@directus/data-sql', async () => {
			// import the actual package, but replace one function with a mock (partial mocking)
			const actual: any = await vi.importActual('@directus/data-sql');

			return {
				...actual,
				convertQuery: vi.fn().mockImplementation(() => {
					const sqlQuery: AbstractSqlQuery = {
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
								{
									type: 'join',
									table: collectionToJoin2,
									as: collectionToJoinId,
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
							[secondFieldId, [secondFieldAlias]],
							[joinField1Id, [collectionToJoin, joinField1Alias]],
							[joinField2Id, [collectionToJoin, joinField2]],
							[joinField1IdM, [collectionToJoin, joinField2]],
							[joinField2IdM, [collectionToJoin, joinField2]],
						]),
					};

					return sqlQuery;
				}),
			};
		});

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

		const driver = new DataDriverPostgres({
			connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
		});

		/* @TODO randomize the mocked return values */
		vi.spyOn(driver, 'getDataFromSource').mockReturnValue({
			// @ts-ignore a promise is normally been returned
			client: null,
			stream: new ReadableStream({
				start(controller) {
					const mockedData = [
						{
							[firstFieldId]: 937,
							[secondFieldId]: 'lorem ipsum',
							[joinField1Id]: 42,
							[joinField2Id]: true,
							[joinField2IdM]: true,
							[joinField1IdM]: 27,
						},
						{
							[firstFieldId]: 937,
							[secondFieldId]: 'lorem ipsum',
							[joinField1Id]: 42,
							[joinField2Id]: true,
							[joinField2IdM]: false,
							[joinField1IdM]: 28,
						},
						{
							[firstFieldId]: 1342,
							[secondFieldId]: 'ipsum dapsum',
							[joinField1Id]: 26,
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
				[secondFieldAlias]: 'lorem ipsum',
				[collectionToJoin]: {
					[joinField1Alias]: 42,
					[joinField2]: true,
				},
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
				[secondFieldAlias]: 'ipsum dapsum',
				[collectionToJoin]: {
					[joinField1Alias]: 26,
					[joinField2]: true,
				},
				[collectionToJoin2]: [],
			},
		];

		expect(actualResult).toEqual(expectedResult);
	});
});
