import type { ReadableStreamDefaultReadResult } from 'node:stream/web';
import type { AbstractSqlNestedMany, AbstractSqlQuery } from '../types/index.js';
import type { AtLeastOneElement } from '@directus/data';
import { ReadableStream } from 'node:stream/web';
import { readToEnd } from './stream-consumer.js';

type SteamResult = ReadableStreamDefaultReadResult<Record<string, unknown>>;

/**
 * This logic handles o2m relational nodes which can be seen as default implementation/behavior for all SQL drivers.
 *
 * @param rootStream the stream of the root query
 * @param nestedManys the nested many nodes which contain the sql query generator
 * @param queryDatabase a function which is defined in the drivers which queries the database
 * @returns the final stream which contains the m part results of the abstract query
 */
export async function makeSubQueriesAndMergeWithRoot(
	rootStream: ReadableStream<Record<string, unknown>>,
	nestedManys: AbstractSqlNestedMany[],
	queryDatabase: (query: AbstractSqlQuery) => Promise<ReadableStream<Record<string, unknown>>>,
): Promise<ReadableStream<Record<string, unknown>>> {
	return new ReadableStream({
		start(controller) {
			const reader = rootStream.getReader();

			async function mergeNestedData({ done, value }: SteamResult): Promise<SteamResult | void> {
				if (done) {
					controller.close();
					return;
				}

				for (const nestedMany of nestedManys) {
					const subQuery = nestedMany.queryGenerator(
						nestedMany.localJoinFields.map((field) => value[field]) as AtLeastOneElement<string | number>,
					);

					const subStream = await queryDatabase(subQuery);
					const subData = await readToEnd(subStream);
					controller.enqueue({ ...value, [nestedMany.alias]: subData });
				}

				return reader.read().then(mergeNestedData);
			}

			reader.read().then(mergeNestedData);
		},
	});
}
