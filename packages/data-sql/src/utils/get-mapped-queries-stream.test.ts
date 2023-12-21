import { expect, test, vi } from 'vitest';
import { getMappedQueriesStream } from './get-mapped-queries-stream.js';
import type { AliasMapping, SubQuery } from '../index.js';
import { ReadableStream } from 'node:stream/web';
import { randomAlpha, randomIdentifier } from '@directus/random';
import { readToEnd } from './stream-consumer.js';
import { randomUUID } from 'crypto';

function getStreamMock(data: Record<string, unknown>[]): ReadableStream<Record<string, unknown>> {
	return new ReadableStream({
		start(controller) {
			data.forEach((chunk) => controller.enqueue(chunk));
			controller.close();
		},
	});
}

test('nested-many', async () => {
	const columnIndexToName = (columnIndex: number) => `c${columnIndex}`;

	//@todo randomize the values
	const columnName = randomIdentifier();
	const columnIndex = 1;
	const columnValue1 = randomAlpha(10);
	const columnValue2 = randomAlpha(10);
	const keyColumnName = randomIdentifier();
	const keyColumnIndex = 0;
	const keyColumnValue1 = randomUUID();
	const keyColumnValue2 = randomUUID();

	const externalTableName = randomIdentifier();
	const externalTableIndex = 0;
	const externalColumnName = randomIdentifier();
	const externalColumnIndex = 0;
	const externalColumnValue1 = randomAlpha(10);
	const externalColumnValue2 = randomAlpha(10);
	const externalColumnValue3 = randomAlpha(10);

	const rootStream = getStreamMock([
		{
			[columnIndexToName(keyColumnIndex)]: keyColumnValue1,
			[columnIndexToName(columnIndex)]: columnValue1,
		},
		{
			[columnIndexToName(keyColumnIndex)]: keyColumnValue2,
			[columnIndexToName(columnIndex)]: columnValue2,
		},
	]);

	const subQuery: SubQuery = () => {
		return {
			rootQuery: {
				clauses: {
					select: [
						{
							type: 'primitive',
							tableIndex: externalTableIndex,
							columnName: externalColumnName,
							columnIndex: externalColumnIndex,
						},
					],
					from: {
						tableName: externalTableName,
						tableIndex: externalTableIndex,
					},
				},
				parameters: [],
			},
			subQueries: [],
			aliasMapping: [{ type: 'root', alias: externalColumnName, columnIndex: externalColumnIndex }],
		};
	};

	const firstDatabaseResponse = [
		{
			[columnIndexToName(externalColumnIndex)]: externalColumnValue1,
		},
		{
			[columnIndexToName(externalColumnIndex)]: externalColumnValue2,
		},
	];

	const secondDatabaseResponse = [
		{
			[columnIndexToName(externalColumnIndex)]: externalColumnValue3,
		},
	];

	const queryDataBaseMockFn = vi
		.fn()
		.mockResolvedValueOnce(getStreamMock(firstDatabaseResponse))
		.mockResolvedValueOnce(getStreamMock(secondDatabaseResponse));

	const aliasMapping: AliasMapping = [
		{ type: 'root', alias: keyColumnName, columnIndex: keyColumnIndex },
		{ type: 'root', alias: columnName, columnIndex: columnIndex },
		{ type: 'sub', alias: externalTableName, index: 0 },
	];

	const resultingStream = getMappedQueriesStream(
		rootStream,
		[subQuery],
		aliasMapping,
		columnIndexToName,
		queryDataBaseMockFn,
	);

	const actualResult = await readToEnd(resultingStream);

	const expectedResult = [
		{
			[keyColumnName]: keyColumnValue1,
			[columnName]: columnValue1,
			[externalTableName]: [
				{
					[externalColumnName]: externalColumnValue1,
				},
				{
					[externalColumnName]: externalColumnValue2,
				},
			],
		},
		{
			[keyColumnName]: keyColumnValue2,
			[columnName]: columnValue2,
			[externalTableName]: [
				{
					[externalColumnName]: externalColumnValue3,
				},
			],
		},
	];

	expect(actualResult).toEqual(expectedResult);
});
