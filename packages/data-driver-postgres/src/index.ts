/**
 * The driver for PostgreSQL which can be registered by using @directus/data.
 *
 *  @packageDocumentation
 */

import type { AbstractQuery, DataDriver } from '@directus/data';
import { convertAbstractQueryToAbstractSqlQuery } from '@directus/data-sql';
import type { Readable } from 'node:stream';
import type { PoolClient } from 'pg';
import pg from 'pg';
import QueryStream from 'pg-query-stream';
import { constructSqlQuery } from './query/index.js';

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

	async query(query: AbstractQuery): Promise<Readable> {
		let client: PoolClient | null = null;

		try {
			client = await this.#pool.connect();
			const abstractSqlQuery = convertAbstractQueryToAbstractSqlQuery(query);
			const sql = constructSqlQuery(abstractSqlQuery);
			const queryStream = new QueryStream(sql.statement, sql.parameters);
			const stream = client.query(queryStream);
			stream.on('end', () => client?.release());
			return stream;
		} catch (err) {
			client?.release();
			throw new Error('Could not query the PostgreSQL datastore: ' + err);
		}
	}
}
