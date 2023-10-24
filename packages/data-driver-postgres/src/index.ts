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
import type { PoolClient } from 'pg';
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

	async getDataFromSource(pool: pg.Pool, sql: ParameterizedSqlStatement): Promise<ReadableStream<Record<string, any>>> {
		const poolClient: PoolClient = await pool.connect();
		const queryStream = new QueryStream(sql.statement, sql.parameters);
		const stream = poolClient.query(queryStream);
		stream.on('end', () => poolClient.release());
		// @TODO release client also on error
		return Readable.toWeb(stream);
	}

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

		return await makeSubQueriesAndMergeWithRoot(rootStream, abstractSql.nestedManys, queryDB);
	}
}
