/**
 * The driver for PostgreSQL which can be registered by using @directus/data.
 *
 * @packageDocumentation
 */
import type { AbstractQuery, AbstractQueryFieldNodeNestedMany, DataDriver } from '@directus/data';
import {
	convertManyNodeToAbstractQuery,
	convertQuery,
	getOrmTransformer,
	getRootQuery,
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
		return Readable.toWeb(stream);
	}

	private convertAbstractQuery(query: AbstractQuery): {
		sql: ParameterizedSqlStatement;
		aliasMapping: Map<string, string[]>;
	} {
		const abstractSql = convertQuery(query);
		const statement = convertToActualStatement(abstractSql.clauses);
		const parameters = convertParameters(abstractSql.parameters);
		return { sql: { statement, parameters }, aliasMapping: abstractSql.aliasMapping };
	}

	async query(query: AbstractQuery): Promise<ReadableStream> {
		//@ts-ignore
		const finalStream = new ReadableStream();
		const root = getRootQuery(query);
		const rootSql = this.convertAbstractQuery(root);
		const nestedManyNodes = query.fields.filter((i) => i.type === 'nested-many') as AbstractQueryFieldNodeNestedMany[];
		const rootStream = await this.getDataFromSource(this.#pool, rootSql.sql);

		for await (const rootChunk of rootStream) {
			for (const nestedMany of nestedManyNodes) {
				const subQuery = convertManyNodeToAbstractQuery(nestedMany, rootChunk);
				const subSql = this.convertAbstractQuery(subQuery);
				const subStream = await this.getDataFromSource(this.#pool, subSql.sql);

				const mPart = [];

				for await (const subChunk of subStream) {
					mPart.push(subChunk);
				}
			}
			// @TODO merge results
		}

		const ormTransformer = getOrmTransformer(rootSql.aliasMapping);
		return rootStream.pipeThrough(ormTransformer);
	}
}
