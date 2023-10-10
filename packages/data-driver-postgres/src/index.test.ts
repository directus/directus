import type { AbstractQuery } from '@directus/data';
import { randomIdentifier } from '@directus/random';
import { expect, test, describe, vi, afterEach } from 'vitest';
import DataDriverPostgres from './index.js';
import type { AbstractSqlQuery } from '@directus/data-sql';

afterEach(() => {
	vi.restoreAllMocks();
});

const randomCollection = randomIdentifier();
const randomCollectionToJoin = randomIdentifier();
const firstField = randomIdentifier();
const firstFieldId = randomIdentifier();
const secondField = randomIdentifier();
const secondFieldId = randomIdentifier();
const secondFieldAlias = randomIdentifier();
const joinField1 = randomIdentifier();
const joinFieldId = randomIdentifier();
const joinField1Alias = randomIdentifier();
const joinField2 = randomIdentifier();
const collectionToJoinId = randomIdentifier();
const joinField2Id = randomIdentifier();
const fk = randomIdentifier();
const foreignPk = randomIdentifier();
const joinAlias = randomIdentifier();

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
									table: randomCollection,
									column: firstField,
									as: firstFieldId,
								},
								{
									type: 'primitive',
									table: randomCollection,
									column: secondField,
									as: secondFieldId,
									alias: secondFieldAlias,
								},
								{
									type: 'primitive',
									table: collectionToJoinId,
									column: joinField1,
									as: joinFieldId,
									alias: joinField1Alias,
								},
								{
									type: 'primitive',
									table: collectionToJoinId,
									column: joinField2,
									as: joinField2Id,
								},
							],
							from: randomCollection,
							joins: [
								{
									type: 'join',
									table: randomCollectionToJoin,
									as: collectionToJoinId,
									on: {
										type: 'condition',
										negate: false,
										condition: {
											type: 'condition-field',
											target: {
												type: 'primitive',
												table: randomCollection,
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
							[secondFieldId, [secondFieldAlias]],
							[joinFieldId, [randomCollectionToJoin, joinField1Alias]],
							[joinField2Id, [randomCollectionToJoin, joinField2]],
						]),
					};

					return sqlQuery;
				}),
			};
		});

		const query: AbstractQuery = {
			collection: randomCollection,
			store: 'randomDataStore1',
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
								store: 'randomDataStore1',
								collection: randomCollectionToJoin,
								fields: [foreignPk],
							},
						},
					},
					alias: joinAlias,
				},
			],
		};

		const driver = new DataDriverPostgres({
			connectionString: 'postgres://postgres:postgres@localhost:5432/postgres',
		});

		vi.spyOn(driver, 'getDataFromSource').mockReturnValue({
			// @ts-ignore a promise is normally been returned
			client: null,
			stream: new ReadableStream({
				start(controller) {
					const mockedData = [
						{
							[firstFieldId]: 937,
							[secondFieldId]: 'lorem ipsum',
							[joinFieldId]: 42,
							[joinField2Id]: true,
						},
						{
							[firstFieldId]: 1342,
							[secondFieldId]: 'ipsum dapsum',
							[joinFieldId]: 26,
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
				[secondFieldAlias]: 'lorem ipsum',
				[randomCollectionToJoin]: {
					[joinField1Alias]: 42,
					[joinField2]: true,
				},
			},
			{
				[firstField]: 1342,
				[secondFieldAlias]: 'ipsum dapsum',
				[randomCollectionToJoin]: {
					[joinField1Alias]: 26,
					[joinField2]: true,
				},
			},
		];

		expect(actualResult).toEqual(expectedResult);
	});
});
