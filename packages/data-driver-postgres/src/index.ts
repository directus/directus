/**
 * The driver for PostgreSQL which can be registered by using @directus/data.
 *
 *  @packageDocumentation
 */
import type { AbstractQuery, DataDriver } from '@directus/data';
import {
	convertToAbstractSqlQueryAndGenerateAliases,
	expand,
	type ParameterizedSqlStatement,
} from '@directus/data-sql';
import type { ReadableStream } from 'node:stream/web';
import type { PoolClient } from 'pg';
import pg from 'pg';
import { constructSqlQuery } from './query/index.js';
import QueryStream from 'pg-query-stream';
import { Readable } from 'node:stream';

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

	async getDataFromSource(pool: pg.Pool, sql: ParameterizedSqlStatement): Promise<{ poolClient: any; stream: any }> {
		const poolClient: PoolClient = await pool.connect();
		const queryStream = new QueryStream(sql.statement, sql.parameters);
		const stream = poolClient.query(queryStream);
		stream.on('end', () => poolClient?.release());
		const webStream = Readable.toWeb(stream);

		return {
			poolClient,
			stream: webStream,
		};
	}

	async query(query: AbstractQuery): Promise<ReadableStream> {
		let client: PoolClient | null = null;

		try {
			const conversionResult = convertToAbstractSqlQueryAndGenerateAliases(query);
			const sql = constructSqlQuery(conversionResult.sql);

			const { poolClient, stream } = await this.getDataFromSource(this.#pool, sql);
			client = poolClient;

			return stream.pipeThrough(expand(conversionResult.aliasMapping));
		} catch (err) {
			client?.release();
			throw new Error('Failed to perform the query: ' + err);
		}
	}
}
