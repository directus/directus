/**
 * Modul to query the PostgreSQL database.
 * Main reason to move it here as a separate module is to be able to mock it properly for unit testing.
 *
 *  @packageDocumentation
 */

import { type ParameterizedSqlStatement } from '@directus/data-sql';
import { Readable } from 'node:stream';
import type { ReadableStream } from 'node:stream/web';
import type { PoolClient } from 'pg';
import pg from 'pg';
import QueryStream from 'pg-query-stream';

export async function queryPostgres(
	pool: pg.Pool,
	sql: ParameterizedSqlStatement
): Promise<{ poolClient: PoolClient; stream: ReadableStream }> {
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
