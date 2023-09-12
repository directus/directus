/**
 * The driver for PostgreSQL which can be registered by using @directus/data.
 *
 *  @packageDocumentation
 */
import type { AbstractQuery, DataDriver } from '@directus/data';
import { convertToAbstractSqlQueryAndGenerateAliases, expand, mapAliasesToNestedPaths } from '@directus/data-sql';
import type { ReadableStream } from 'node:stream/web';
import type { PoolClient } from 'pg';
import pg from 'pg';
import { constructSqlQuery } from './query/index.js';
import { queryPostgres } from './postgres-query.js';

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

	async query(query: AbstractQuery): Promise<ReadableStream> {
		let client: PoolClient | null = null;

		try {
			const abstractSqlQuery = convertToAbstractSqlQueryAndGenerateAliases(query);
			const sql = constructSqlQuery(abstractSqlQuery);

			const { poolClient, stream } = await queryPostgres(this.#pool, sql);
			client = poolClient;

			const aliasMap = mapAliasesToNestedPaths(
				query.collection,
				query.nodes,
				abstractSqlQuery.select,
				abstractSqlQuery.joins ?? []
			);

			return stream.pipeThrough(expand(aliasMap));
		} catch (err) {
			client?.release();
			throw new Error('Failed to perform the query: ' + err);
		}
	}
}
