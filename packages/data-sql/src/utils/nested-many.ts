import type { ReadableStreamDefaultReadResult } from 'node:stream/web';
import type { AbstractSqlNestedMany, AbstractSqlQuery } from '../types/index.js';
import type { AtLeastOneElement } from '@directus/data';
import { ReadableStream } from 'node:stream/web';

type SteamResult = ReadableStreamDefaultReadResult<Record<string, any>>;

export async function makeSubQueriesAndMergeWithRoot(
	rootStream: ReadableStream<Record<string, any>>,
	nestedManys: AbstractSqlNestedMany[],
	queryDB: (query: AbstractSqlQuery) => Promise<ReadableStream<Record<string, any>>>
): Promise<ReadableStream<Record<string, any>>> {
	return new ReadableStream({
		start(controller) {
			const reader = rootStream.getReader();

			async function mergeNestedData({ done, value }: SteamResult): Promise<SteamResult | void> {
				if (done) {
					controller.close();
					return;
				}

				for (const nestedMany of nestedManys) {
					// @TODO do some error handling, extend tests

					const subQuery = nestedMany.queryGenerator(
						nestedMany.internalIdentifierFields.map((field) => value[field]) as AtLeastOneElement<string | number>
					);

					const subStream = await queryDB(subQuery);
					const subData = [];

					for await (const subChunk of subStream) {
						subData.push(subChunk);
					}

					controller.enqueue({ ...value, [nestedMany.collection]: subData });
				}

				return reader.read().then(mergeNestedData);
			}

			reader.read().then(mergeNestedData);
		},
	});
}
