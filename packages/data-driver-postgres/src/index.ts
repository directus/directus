/**
 * The driver for PostgreSQL which can be registered by using @directus/data.
 *
 * @packageDocumentation
 */
import type { AbstractQuery, DataDriver } from '@directus/data';
import {
	convertQuery,
	getOrmTransformer,
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
		return Readable.toWeb(stream);
	}

	// We might can move this function into data-sql and pass some functions from the driver to it (?)
	private async queryDatabase(abstractSql: AbstractSqlQuery): Promise<ReadableStream<Record<string, any>>> {
		// const abstractSql = convertQuery(query);
		// console.log('querying database', abstractSql.clauses);
		const statement = convertToActualStatement(abstractSql.clauses);
		const parameters = convertParameters(abstractSql.parameters);
		const stream = await this.getDataFromSource(this.#pool, { statement, parameters });
		const ormTransformer = getOrmTransformer(abstractSql.aliasMapping);
		return stream.pipeThrough(ormTransformer);
	}

	async query(query: AbstractQuery): Promise<ReadableStream> {
		const abstractSql = convertQuery(query);
		const rootStream = await this.queryDatabase(abstractSql);

		let finalChunk: Record<string, any> = {};

		for await (const chunk of rootStream) {
			for (const nestedMany of abstractSql.nestedManys) {
				// @TODO enable composite keys
				const identifierValueFromChunk = chunk[nestedMany.internalIdentifierFields[0]];

				const subQuery = nestedMany.queryGenerator([identifierValueFromChunk]);
				const subStream = await this.queryDatabase(subQuery);
				const subData = [];

				for await (const subChunk of subStream) {
					subData.push(Object.values(subChunk));
				}

				finalChunk = { ...chunk, [nestedMany.collection]: subData };
				console.log(finalChunk);
			}
		}

		return new ReadableStream({
			start(controller) {
				controller.enqueue(finalChunk);
			},
		});
	}

	// async queryAbstract(query: AbstractQuery): Promise<ReadableStream> {
	// 	const rootQuery = getRootQuery(query);
	// 	const rootStream = await this.queryDatabase(rootQuery);
	// 	const nestedManyNodes = query.fields.filter((i) => i.type === 'nested-many') as AbstractQueryFieldNodeNestedMany[];

	// 	const subStreams = [];

	// 	for await (const rootChunk of rootStream) {
	// 		for (const nestedMany of nestedManyNodes) {
	// 			if (nestedMany.meta.type !== 'o2m') {
	// 				throw new Error('o2a is not yet implemented');
	// 			}

	// 			const subQuery = convertManyNodeToAbstractQuery(nestedMany, rootChunk);
	// 			const subStream = await this.queryDatabase(subQuery);
	// 			subStreams.push(subStream);
	// 		}
	// 	}

	// 	return rootStream;
	// }
}
