/**
 * The driver for PostgreSQL which can be registered by using @directus/data.
 *
 * @packageDocumentation
 */
import type { AbstractQuery, DataDriver } from '@directus/data';
import {
	convertQuery,
	getExpander,
	makeSubQueriesAndMergeWithRoot,
	type AbstractSqlQuery,
	type ParameterizedSqlStatement,
} from '@directus/data-sql';
import { ReadableStream } from 'node:stream/web';
import pg from 'pg';
import { convertToActualStatement } from './query/index.js';
import QueryStream from 'pg-query-stream';
import { Readable } from 'node:stream';
import { convertParameters } from './query/parameters.js';

export interface DataDriverPostgresConfig {
	connectionString: string;
}

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

	/**
	 * Opens a stream for the given SQL statement.
	 *
	 * @param pool the PostgreSQL client pool
	 * @param sql A parameterized SQL statement
	 * @returns A readable web stream for the query results
	 * @throw An error when the query cannot be performed
	 */
	async getDataFromSource(
		pool: pg.Pool,
		sql: ParameterizedSqlStatement,
	): Promise<ReadableStream<Record<string, unknown>>> | never {
		try {
			const poolClient = await pool.connect();
			const queryStream = new QueryStream(sql.statement, sql.parameters);
			const stream = poolClient.query(queryStream);

			stream.on('end', () => poolClient.release());
			stream.on('error', () => poolClient.release());

			return Readable.toWeb(stream);
		} catch (error: any) {
			throw new Error('Failed to query the database: ', error);
		}
	}

	/**
	 * Converts the abstract query into PostgreSQL and executes it.
	 *
	 * @param abstractSql The abstract query
	 * @returns The database results converted to a nested object
	 * @throws An error when the conversion or the database request fails
	 */
	private async queryDatabase(abstractSql: AbstractSqlQuery): Promise<ReadableStream<Record<string, unknown>>> {
		const statement = convertToActualStatement(abstractSql.clauses);
		const parameters = convertParameters(abstractSql.parameters);
		const stream = await this.getDataFromSource(this.#pool, { statement, parameters });
		const ormExpander = getExpander(abstractSql.aliasMapping);
		return stream.pipeThrough(ormExpander);
	}

	async query(query: AbstractQuery): Promise<ReadableStream<Record<string, unknown>>> {
		const abstractSql = convertQuery(query);

		const rootStream = await this.queryDatabase(abstractSql);

		if (abstractSql.nestedManys.length === 0) {
			return rootStream;
		}

		return await makeSubQueriesAndMergeWithRoot(rootStream, abstractSql.nestedManys, (query) =>
			this.queryDatabase(query),
		);
	}
}
