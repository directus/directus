/**
 * The driver for PostgreSQL which can be registered by using @directus/data.
 *
 *  @packageDocumentation
 */

import type { AbstractQuery, DataDriver } from '@directus/data';
import { convertAbstractQueryToSqlStatement } from '@directus/data-sql';
import type { Readable } from 'node:stream';
import { Pool } from 'pg';
import QueryStream from 'pg-query-stream';
import { constructSql } from './query/index.js';

export interface DataDriverPostgresConfig {
	connectionString: string;
}

export default class DataDriverPostgres implements DataDriver {
	#config: DataDriverPostgresConfig;
	#pool: Pool;

	constructor(config: DataDriverPostgresConfig) {
		this.#config = config;

		this.#pool = new Pool({
			connectionString: this.#config.connectionString,
		});
	}

	async destroy() {
		await this.#pool.end();
	}

	async query(query: AbstractQuery): Promise<Readable> {
		try {
			const sqlStatement = convertAbstractQueryToSqlStatement(query);
			const sqlString = constructSql(sqlStatement);
			const queryStream = new QueryStream(sqlString /*, sqlStatement.parameters */);
			return this.#pool.query(queryStream);
		} catch (err) {
			throw new Error('Could not query the PostgreSQL datastore: ' + err);
		}
	}
}
