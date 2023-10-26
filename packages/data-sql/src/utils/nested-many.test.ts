import { expect, test, vi } from 'vitest';
import { makeSubQueriesAndMergeWithRoot } from './nested-many.js';
import type { AbstractSqlNestedMany } from '../index.js';
import { ReadableStream } from 'node:stream/web';
import { randomAlpha, randomIdentifier } from '@directus/random';
import { readToEnd } from './stream-consumer.js';

function getStreamMock(data: Record<string, unknown>[]): ReadableStream<Record<string, unknown>> {
	return new ReadableStream({
		start(controller) {
			data.forEach((chunk) => controller.enqueue(chunk));
			controller.close();
		},
	});
}

test('nested-many logic', async () => {
	//@todo randomize the values
	const localPkField = randomIdentifier();
	const pkFieldValue1 = randomAlpha(50);
	const pkFieldValue2 = randomAlpha(50);

	const desiredLocalField = randomIdentifier();
	const desiredLocalFieldValue1 = randomIdentifier();
	const desiredLocalFieldValue2 = randomIdentifier();

	const rootStream = getStreamMock([
		{
			[localPkField]: pkFieldValue1,
			[desiredLocalField]: desiredLocalFieldValue1,
		},
		{
			[localPkField]: pkFieldValue2,
			[desiredLocalField]: desiredLocalFieldValue2,
		},
	]);

	// foreign table specs
	const foreignTable = randomIdentifier();
	const foreignIdField = randomIdentifier();

	// foreign fields
	const foreignField = randomIdentifier();
	const foreignFieldId = randomIdentifier();

	const nestedManys: AbstractSqlNestedMany[] = [
		{
			queryGenerator: (internalRelationalFieldValues) => ({
				clauses: {
					select: [
						{
							type: 'primitive',
							table: foreignTable,
							column: foreignField,
							as: foreignFieldId,
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
								column: localPkField,
							},
							compareTo: {
								type: 'value',
								parameterIndex: 0,
							},
						},
						negate: false,
					},
				},
				// @ts-ignore
				parameters: [internalRelationalFieldValues],
				aliasMapping: new Map([[foreignFieldId, [foreignField]]]),
				nestedManys: [],
			}),
			localJoinFields: [localPkField],
			foreignJoinFields: [foreignIdField],
			alias: foreignTable,
		},
	];

	// database response mocks
	const foreignFieldValue1 = randomIdentifier();
	const foreignFieldValue2 = randomIdentifier();
	const foreignFieldValue3 = randomIdentifier();

	const firstDatabaseResponse = [
		{
			[foreignField]: foreignFieldValue1,
		},
		{
			[foreignField]: foreignFieldValue2,
		},
	];

	const secondDatabaseResponse = [
		{
			[foreignField]: foreignFieldValue3,
		},
	];

	const queryDataBaseMockFn = vi
		.fn()
		.mockResolvedValueOnce(getStreamMock(firstDatabaseResponse))
		.mockResolvedValueOnce(getStreamMock(secondDatabaseResponse));

	const resultingStream = await makeSubQueriesAndMergeWithRoot(rootStream, nestedManys, queryDataBaseMockFn);
	const actualResult = await readToEnd(resultingStream);

	const expectedResult = [
		{
			[localPkField]: pkFieldValue1,
			[desiredLocalField]: desiredLocalFieldValue1,
			[foreignTable]: [
				{
					[foreignField]: foreignFieldValue1,
				},
				{
					[foreignField]: foreignFieldValue2,
				},
			],
		},
		{
			[localPkField]: pkFieldValue2,
			[desiredLocalField]: desiredLocalFieldValue2,
			[foreignTable]: [
				{
					[foreignField]: foreignFieldValue3,
				},
			],
		},
	];

	expect(actualResult).toEqual(expectedResult);
});
