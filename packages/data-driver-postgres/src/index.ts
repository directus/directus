/**
 * The driver for PostgreSQL which can be registered by using @directus/data.
 *
 * @packageDocumentation
 */
import type { AbstractQuery, AtLeastOneElement, DataDriver } from '@directus/data';
import { convertQuery, getExpander, type AbstractSqlQuery, type ParameterizedSqlStatement } from '@directus/data-sql';
import { ReadableStream, type ReadableStreamDefaultReadResult } from 'node:stream/web';
import type { PoolClient } from 'pg';
import pg from 'pg';
import { convertToActualStatement } from './query/index.js';
import QueryStream from 'pg-query-stream';
import { Readable } from 'node:stream';
import { convertParameters } from './query/parameters.js';

export interface DataDriverPostgresConfig {
	connectionString: string;
}

type SteamResult = ReadableStreamDefaultReadResult<Record<string, any>>;

export default class DataDriverPostgres implements DataDriver {
	#config: DataDriverPostgresConfig;
	#pool: pg.Pool;

	constructor(config: DataDriverPostgresConfig) {
		this.#config = config;

		this.#pool = new pg.Pool({
			connectionString: this.#config.connectionString,
		});
	}

	async destroy() {
		await this.#pool.end();
	}

	async getDataFromSource(pool: pg.Pool, sql: ParameterizedSqlStatement): Promise<ReadableStream<Record<string, any>>> {
		const poolClient: PoolClient = await pool.connect();
		const queryStream = new QueryStream(sql.statement, sql.parameters);
		const stream = poolClient.query(queryStream);
		stream.on('end', () => poolClient.release());
		return Readable.toWeb(stream);
	}

	// We might can move this function into data-sql and pass some functions from the driver to it (?)
	private async queryDatabase(abstractSql: AbstractSqlQuery): Promise<ReadableStream<Record<string, any>>> {
		const statement = convertToActualStatement(abstractSql.clauses);
		const parameters = convertParameters(abstractSql.parameters);
		const stream = await this.getDataFromSource(this.#pool, { statement, parameters });
		const ormExpander = getExpander(abstractSql.aliasMapping);
		return stream.pipeThrough(ormExpander);
	}

	async query(query: AbstractQuery): Promise<ReadableStream<Record<string, any>>> {
		const abstractSql = convertQuery(query);
		const queryDB = this.queryDatabase.bind(this);
		const rootStream = await queryDB(abstractSql);

		if (abstractSql.nestedManys.length === 0) {
			return rootStream;
		}

		const stream = new ReadableStream({
			start(controller) {
				const reader = rootStream.getReader();

				async function mergeNestedData({ done, value }: SteamResult): Promise<SteamResult | void> {
					if (done) {
						controller.close();
						return;
					}

					for (const nestedMany of abstractSql.nestedManys) {
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

		return stream;
	}
}
