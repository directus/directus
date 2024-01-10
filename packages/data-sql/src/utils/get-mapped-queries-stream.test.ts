import { expect, test, vi } from 'vitest';
import { getMappedQueriesStream } from './get-mapped-queries-stream.js';
import type { AliasMapping, SubQuery } from '../index.js';
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

test('nested-many', async () => {
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

	// foreign fields
	const foreignField = randomIdentifier();
	const foreignFieldId = randomIdentifier();

	const subQuery: SubQuery = () => {
		return {
			rootQuery: {
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
				},
				parameters: [],
			},
			subQueries: [],
			aliasMapping: [{ type: 'root', alias: foreignField, column: foreignFieldId }],
		};
	};

	// database response mocks
	const foreignFieldValue1 = randomIdentifier();
	const foreignFieldValue2 = randomIdentifier();
	const foreignFieldValue3 = randomIdentifier();

	const firstDatabaseResponse = [
		{
			[foreignFieldId]: foreignFieldValue1,
		},
		{
			[foreignFieldId]: foreignFieldValue2,
		},
	];

	const secondDatabaseResponse = [
		{
			[foreignFieldId]: foreignFieldValue3,
		},
	];

	const queryDataBaseMockFn = vi
		.fn()
		.mockResolvedValueOnce(getStreamMock(firstDatabaseResponse))
		.mockResolvedValueOnce(getStreamMock(secondDatabaseResponse));

	const aliasMapping: AliasMapping = [
		{ type: 'root', alias: localPkField, column: localPkField },
		{ type: 'root', alias: desiredLocalField, column: desiredLocalField },
		{ type: 'sub', alias: foreignTable, index: 0 },
	];

	const resultingStream = getMappedQueriesStream(rootStream, [subQuery], aliasMapping, queryDataBaseMockFn);
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
