import { ReadableStream } from 'node:stream/web';
import type { AbstractSqlQuery, AliasMapping, SubQuery } from '../types/index.js';
import { mapResult } from './map-result.js';
import { readToEnd } from './stream-consumer.js';

/**
 * This logic handles o2m relational nodes which can be seen as default implementation/behavior for all SQL drivers.
 *
 * @param rootStream the stream of the root query
 * @param subQueries the sub query generators that generate queries to query relational data
 * @param aliasMapping the mapping that maps the result structure to root rows and sub query results
 * @param queryDatabase a function which is defined in the drivers which queries the database
 * @returns the final stream which contains the mapped root query and sub query results
 */
export function getMappedQueriesStream(
	rootStream: ReadableStream<Record<string, unknown>>,
	subQueries: SubQuery[],
	aliasMapping: AliasMapping,
	queryDatabase: (query: AbstractSqlQuery) => Promise<ReadableStream<Record<string, unknown>>>,
): ReadableStream<Record<string, unknown>> {
	return new ReadableStream({
		async start(controller) {
			for await (const rootRow of rootStream) {
				const subResult = await Promise.all(
					subQueries.map(async (subQuery) => {
						const generatedSubQuery = subQuery(rootRow);
						const subStream = await queryDatabase(generatedSubQuery.rootQuery);

						const mappedQueriesStream = getMappedQueriesStream(
							subStream,
							generatedSubQuery.subQueries,
							generatedSubQuery.aliasMapping,
							queryDatabase,
						);

						return readToEnd(mappedQueriesStream);
					}),
				);

				const result = mapResult(aliasMapping, rootRow, subResult);

				controller.enqueue(result);
			}

			controller.close();
		},
	});
}
