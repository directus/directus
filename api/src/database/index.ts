import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import path from 'path';
import { performance } from 'perf_hooks';
import { useEnv } from '@directus/env';
import type { SchemaInspector } from '@directus/schema';
import { createInspector } from '@directus/schema';
import type { DatabaseClient } from '@directus/types';
import { isObject } from '@directus/utils';
import fse from 'fs-extra';
import type { Knex } from 'knex';
import knex from 'knex';
import { isArray, merge, toArray } from 'lodash-es';
import { getExtensionsPath } from '../extensions/lib/get-extensions-path.js';
import { useLogger } from '../logger/index.js';
import { useMetrics } from '../metrics/index.js';
import { getConfigFromEnv } from '../utils/get-config-from-env.js';
import { validateEnv } from '../utils/validate-env.js';
import { getHelpers } from './helpers/index.js';

type QueryInfo = Partial<Knex.Sql> & {
	sql: Knex.Sql['sql'];
	__knexUid: string;
	__knexTxId: string;
	[key: string | number | symbol]: any;
};

let database: Knex | null = null;
let inspector: SchemaInspector | null = null;

const __dirname = dirname(fileURLToPath(import.meta.url));

export default getDatabase;

export function getDatabase(): Knex {
	if (database) {
		return database;
	}

	const env = useEnv();
	const logger = useLogger();
	const metrics = useMetrics();

	const {
		client,
		version,
		searchPath,
		connectionString,
		pool: poolConfig = {},
		...connectionConfig
	} = getConfigFromEnv('DB_', { omitPrefix: 'DB_EXCLUDE_TABLES' });

	const requiredEnvVars = ['DB_CLIENT'];

	switch (client) {
		case 'sqlite3':
			requiredEnvVars.push('DB_FILENAME');
			break;

		case 'oracledb':
			if (!env['DB_CONNECT_STRING']) {
				requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
			} else {
				requiredEnvVars.push('DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING');
			}

			break;

		case 'cockroachdb':
		case 'pg':
			if (!connectionString) {
				requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER');
			} else {
				requiredEnvVars.push('DB_CONNECTION_STRING');
			}

			break;
		case 'mysql':
			if (!env['DB_SOCKET_PATH']) {
				requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
			} else {
				requiredEnvVars.push('DB_DATABASE', 'DB_USER', 'DB_PASSWORD', 'DB_SOCKET_PATH');
			}

			break;
		case 'mssql':
			if (!env['DB_TYPE'] || env['DB_TYPE'] === 'default') {
				requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
			}

			break;
		default:
			requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
	}

	validateEnv(requiredEnvVars);

	const knexConfig: Knex.Config = {
		client,
		version,
		searchPath,
		connection: connectionString || connectionConfig,
		log: {
			warn: (msg) => {
				// Ignore warnings about returning not being supported in some DBs
				if (msg.startsWith('.returning()')) return;
				if (msg.endsWith('does not currently support RETURNING clause')) return;

				// Ignore warning about MySQL not supporting TRX for DDL
				if (msg.startsWith('Transaction was implicitly committed, do not mix transactions and DDL with MySQL')) return;

				return logger.warn(msg);
			},
			error: (msg) => logger.error(msg),
			deprecate: (msg) => logger.info(msg),
			debug: (msg) => logger.debug(msg),
		},
		pool: poolConfig,
	};

	if (client === 'sqlite3') {
		knexConfig.useNullAsDefault = true;

		poolConfig.afterCreate = (conn: any, callback: any) => {
			logger.trace('Enabling SQLite Foreign Keys support...');

			conn.run('PRAGMA foreign_keys = ON');

			callback(null, conn);
		};
	}

	if (client === 'cockroachdb') {
		poolConfig.afterCreate = (conn: any, callback: any) => {
			logger.trace('Setting CRDB serial_normalization and default_int_size');

			conn.query('SET serial_normalization = "sql_sequence"');
			conn.query('SET default_int_size = 4');

			callback(null, conn);
		};
	}

	if (client === 'oracledb') {
		poolConfig.afterCreate = (conn: any, callback: any) => {
			logger.trace('Setting OracleDB NLS_DATE_FORMAT and NLS_TIMESTAMP_FORMAT');

			// enforce proper ISO standard 2024-12-10T10:54:00.123Z for datetime/timestamp
			conn.execute('ALTER SESSION SET NLS_TIMESTAMP_FORMAT = \'YYYY-MM-DD"T"HH24:MI:SS.FF3"Z"\'');

			// enforce 2024-12-10 date formet
			conn.execute("ALTER SESSION SET NLS_DATE_FORMAT = 'YYYY-MM-DD'");

			callback(null, conn);
		};
	}

	if (client === 'mysql') {
		// Remove the conflicting `filename` option, defined by default in the Docker Image
		if (isObject(knexConfig.connection)) delete knexConfig.connection['filename'];

		Object.assign(knexConfig, { client: 'mysql2' });
	}

	if (client === 'mssql') {
		// This brings MS SQL in line with the other DB vendors. We shouldn't do any automatic
		// timezone conversion on the database level, especially not when other database vendors don't
		// act the same
		merge(knexConfig, { connection: { options: { useUTC: false } } });
	}

	database = knex.default(knexConfig);
	validateDatabaseCharset(database);

	// TEMP DEBUG (strip after diagnosing): trace the mssql "SentClientRequest" connection poisoning.
	// Records the last SQL run on each pooled connection, logs when a query leaves its connection in a
	// non-LoggedIn state (the poisoning moment), and logs when such a poisoned connection is later
	// handed out of the pool (the victim) with the op that poisoned it. Uses console.error (→ server
	// stderr → blackbox "[MAIN]" echo) since LOG_LEVEL=error swallows warn. Observe-only:
	// validateConnection still returns the original verdict (no rejection/churn).
	if (client === 'mssql') {
		const mssqlClient = database.client as any;
		const lastOp = new Map<unknown, string>();
		const inFlight = new Map<unknown, { sql: string; stack: string }>();

		// Monotonic seq + relative timestamp so the [poison] lines can be ordered across connections.
		let seq = 0;
		const t0 = performance.now();
		const ts = () => (performance.now() - t0).toFixed(1);
		const uidOf = (c: any) => c?.__knexUid ?? '?';

		// Transaction-control ops that issue a TM request and 500 if fired on a non-LoggedIn connection.
		// rollbackTransaction is excluded -- knex pre-checks its state and rejects cleanly on its own.
		const WAIT_TXN_OPS = new Set(['beginTransaction', 'saveTransaction', 'commitTransaction']);

		// Per-connection ring buffer of tedious state transitions, dumped only when that connection hits a
		// poison event. The first run proved this is NOT the shared-requestQueue (ENQUEUE/STRANDED/CROSS-CONN
		// never fired) and NOT a concurrent client.query (CONCURRENT never fired) -- yet a connection whose
		// last client.query was the permission lookup ends up in SentClientRequest at commit time. So some
		// request the client.query wrapper can't see (a `client.stream` -> _stream, or a txn-manager
		// begin/commit) strands it. Wrapping `transitionTo` captures EVERY request type, since each drives a
		// LoggedIn<->SentClientRequest transition. Observe-only.
		const HISTORY = new Map<string, string[]>();
		const RING = 32;

		const recordEvent = (uid: string, label: string) => {
			let buf = HISTORY.get(uid);

			if (!buf) {
				buf = [];
				HISTORY.set(uid, buf);
			}

			buf.push(`${ts()} ${label}`);
			if (buf.length > RING) buf.shift();
		};

		const recordTransition = (connection: any, newState: any) => {
			const req = connection?.request;
			const reqSql = String(req?.sqlTextOrProcedure ?? req?.constructor?.name ?? '').slice(0, 80);
			recordEvent(uidOf(connection), `${connection?.state?.name}->${newState?.name ?? newState} req="${reqSql}"`);
		};

		const dumpHistory = (uid: any) => `\n  history:\n    ${(HISTORY.get(uid) ?? ['<none>']).join('\n    ')}`;

		// Describe the request currently occupying a connection (tedious sets connection.request while a
		// request is in flight). Each request is tagged in _enqueueRequest with __forUid (the connection it
		// was enqueued for) + __seq. If __forUid !== this connection's uid the request belongs to a FOREIGN
		// flow sharing the connection -- the key signal for the inflight="none" mystery.
		const blockerInfo = (connection: any) => {
			const r = connection?.request;
			if (!r) return 'blocker=none';
			const forUid = r.__forUid;
			const foreign = forUid !== undefined && forUid !== connection?.__knexUid;
			return `blocker: seq=${r.__seq ?? '?'} forUid=${forUid ?? '?'}${foreign ? ' FOREIGN' : ''} sql="${String(r.sqlTextOrProcedure ?? r.constructor?.name ?? '').slice(0, 80)}"`;
		};

		// ---- knex shared-requestQueue instrumentation (the suspected seed of the poisoning) ----
		// knex's Client_MSSQL keeps `requestQueue` on the PROTOTYPE (shared across all pooled
		// connections) and `_chomp(connection)` runs a popped request on whatever connection is
		// passed in, guarded only by `connection.state === 'LoggedIn'`. `_enqueueRequest` chomps
		// synchronously on the connection it was given; if that connection isn't LoggedIn the request
		// is left stranded in the shared queue and later gets execSql'd on a DIFFERENT connection by a
		// nextTick `_chomp` (which bypasses our client.query wrapper -> matches "in-flight: none").
		// We tag each request with the connection it was enqueued for and flag the three anomalies that
		// would decouple a request from its connection. Observe-only.
		const origEnqueue =
			typeof mssqlClient._enqueueRequest === 'function' ? mssqlClient._enqueueRequest.bind(mssqlClient) : null;

		const origChomp = typeof mssqlClient._chomp === 'function' ? mssqlClient._chomp.bind(mssqlClient) : null;

		if (origEnqueue && origChomp) {
			mssqlClient._enqueueRequest = function (request: any, connection: any) {
				const uid = uidOf(connection);
				const state = connection?.state?.name;

				request.__forUid = uid;
				request.__seq = ++seq;
				request.__sql = String(request?.sqlTextOrProcedure ?? '').slice(0, 120);

				// SEED CANDIDATE: enqueueing a request on a connection that isn't ready to run it. In
				// normal operation knex only hands _query a freshly-acquired LoggedIn connection, so this
				// should never fire -- if it does, it's the moment a request gets decoupled.
				if (state !== 'LoggedIn') {
					// eslint-disable-next-line no-console
					console.error(
						`[poison] ENQUEUE on non-LoggedIn conn=${uid} state=${state} seq=${request.__seq} qlen=${mssqlClient.requestQueue.length} sql=${request.__sql} | last op: ${lastOp.get(uid)} @${ts()}`,
					);
				}

				origEnqueue(request, connection);

				// If the synchronous _chomp didn't drain it, the request is stranded in the shared queue
				// waiting for some other connection's nextTick _chomp -> cross-connection execution risk.
				if (mssqlClient.requestQueue.includes(request)) {
					// eslint-disable-next-line no-console
					console.error(
						`[poison] STRANDED req seq=${request.__seq} forConn=${uid} state=${state} qlen=${mssqlClient.requestQueue.length} sql=${request.__sql} | last op: ${lastOp.get(uid)} @${ts()}`,
					);
				}
			};

			mssqlClient._chomp = function (connection: any) {
				const uid = uidOf(connection);
				const state = connection?.state?.name;
				// _chomp pops from the end (LIFO); peek what it's about to run.
				const next = mssqlClient.requestQueue[mssqlClient.requestQueue.length - 1];

				// SMOKING GUN: a request enqueued for one connection is about to run on another.
				if (state === 'LoggedIn' && next && next.__forUid !== undefined && next.__forUid !== uid) {
					// eslint-disable-next-line no-console
					console.error(
						`[poison] CROSS-CONN chomp: req seq=${next.__seq} enqueued-for=${next.__forUid} now running on conn=${uid} state=${state} sql=${next.__sql} @${ts()}`,
					);
				}

				return origChomp(connection);
			};
		}

		// The DIRECT poisoning event: a connection handed back to the pool while tedious still has it
		// mid-request. knex's mssql validateConnection only checks `.connected` (not `.state`), so this
		// connection will pass validation and be dealt out to the next acquirer, whose beginTransaction
		// then 500s with "Requests can only be made in the LoggedIn state". Low-noise: a healthy runner
		// only releases a connection after its query/txn has settled (-> LoggedIn).
		const origRelease =
			typeof mssqlClient.releaseConnection === 'function' ? mssqlClient.releaseConnection.bind(mssqlClient) : null;

		if (origRelease) {
			mssqlClient.releaseConnection = function (connection: any) {
				const uid = uidOf(connection);
				const state = connection?.state?.name;

				if (state && state !== 'LoggedIn') {
					// eslint-disable-next-line no-console
					console.error(
						`[poison] RELEASE to pool conn=${uid} in state=${state} | in-flight: ${inFlight.get(uid)?.sql ?? 'none'} | last op: ${lastOp.get(uid)} @${ts()}${dumpHistory(uid)}`,
					);
				}

				return origRelease(connection);
			};
		}

		const origQuery = mssqlClient.query.bind(mssqlClient);

		mssqlClient.query = async (connection: any, obj: any) => {
			const uid = connection?.__knexUid;
			const sql = String(obj?.sql ?? obj?.method ?? obj ?? '').slice(0, 160);

			// A second query starting while one is already running on the same connection = concurrent use.
			const prior = inFlight.get(uid);

			if (prior) {
				// eslint-disable-next-line no-console
				console.error(
					`[poison] CONCURRENT use of conn=${uid}: starting "${sql}" while still running "${prior.sql}"\n  in-flight origin:${prior.stack}`,
				);
			}

			// Capture where this query was issued, so if the connection is released/re-acquired while the
			// query is still in flight we can print the Directus call site that left it running.
			inFlight.set(uid, { sql, stack: String(new Error('origin').stack).split('\n').slice(2, 10).join('\n') });
			lastOp.set(uid, sql);

			try {
				return await origQuery(connection, obj);
			} catch (err: any) {
				const state = connection?.state?.name;

				if (state && state !== 'LoggedIn') {
					// eslint-disable-next-line no-console
					console.error(`[poison] query left conn=${uid} in state=${state} | sql: ${sql} | err: ${err?.message}`);
				}

				throw err;
			} finally {
				// Observe-only: a resolved query leaving its connection non-LoggedIn. NOTE: this also fires
				// for queries INSIDE a transaction (the connection is legitimately busy then), so do NOT act
				// on it — disposing such a connection tears down an active transaction ("Connection closed
				// before request completed" + FK violations). Logging only.
				const after = connection?.state?.name;

				if (after && after !== 'LoggedIn') {
					// eslint-disable-next-line no-console
					console.error(
						`[poison] query FINISHED but left conn=${uid} in state=${after} | sql: ${sql}${dumpHistory(uid)}`,
					);
				}

				inFlight.delete(uid);
			}
		};

		// Wrap the tedious transaction methods (knex calls these, not client.query) so we catch a txn op
		// that's started while a query is in flight, or that leaves the connection in a non-LoggedIn state.
		const wrappedConns = new WeakSet<object>();

		const wrapTxnMethods = (connection: any) => {
			if (!connection || wrappedConns.has(connection)) return;
			wrappedConns.add(connection);
			const uid = connection.__knexUid;

			// Record every state transition on this connection into its ring buffer.
			if (typeof connection.transitionTo === 'function') {
				const origTransition = connection.transitionTo.bind(connection);

				connection.transitionTo = function (newState: any) {
					recordTransition(connection, newState);
					return origTransition(newState);
				};
			}

			// Includes saveTransaction (mssql SAVEPOINT) -- knex uses it for nested transactions, which
			// Directus leans on during relational mutations, and our client.query wrapper never sees it.
			for (const method of ['beginTransaction', 'saveTransaction', 'commitTransaction', 'rollbackTransaction']) {
				const orig = connection[method];
				if (typeof orig !== 'function') continue;

				connection[method] = function (this: any, callback: any, ...rest: any[]) {
					const priorQuery = inFlight.get(uid);

					if (priorQuery) {
						// eslint-disable-next-line no-console
						console.error(
							`[poison] ${method} on conn=${uid} while query in flight "${priorQuery.sql}"\n  query origin:${priorQuery.stack}`,
						);
					}

					const wrappedCallback =
						typeof callback === 'function'
							? function (this: any, err: any) {
									const st = connection.state?.name;
									recordEvent(uid, `${method} cb state=${st}${err ? ` err="${err.message}"` : ''}`);

									if (st && st !== 'LoggedIn') {
										// eslint-disable-next-line no-console
										console.error(
											`[poison] ${method} left conn=${uid} in state=${st}${err ? ` | err: ${err.message}` : ''}${dumpHistory(uid)}`,
										);
									}

									// eslint-disable-next-line prefer-rest-params
									return callback.apply(this, arguments);
								}
							: callback;

					// REAL FIX (mssql txn control): tedious permits one request per connection. If the
					// connection is mid-request when knex issues begin/savepoint/commit, knex fires the TM
					// request blindly and 500s with "Requests can only be made in the LoggedIn state" (only
					// rollback pre-checks). Instead briefly wait for the in-flight request to drain, then
					// issue. Bounded -> a genuinely stuck request still falls through to the original
					// behaviour. Does NOT dispose/reject/churn the connection (cf. reverted attempts #3/#4),
					// so it can't tear down a live transaction. WAIT lines are logged so we keep diagnosing.
					if (WAIT_TXN_OPS.has(method) && connection.state?.name !== 'LoggedIn') {
						const MAX_WAIT_MS = 2000;
						const STEP_MS = 10;
						let waited = 0;

						// eslint-disable-next-line no-console
						console.error(
							`[poison] ${method} WAIT conn=${uid} state=${connection.state?.name} ${blockerInfo(connection)} @${ts()}`,
						);

						recordEvent(uid, `${method} WAIT-start state=${connection.state?.name}`);

						const issueWhenReady = () => {
							if (connection.state?.name === 'LoggedIn' || waited >= MAX_WAIT_MS) {
								recordEvent(uid, `${method} WAIT-end state=${connection.state?.name} waited=${waited}ms`);

								if (connection.state?.name !== 'LoggedIn') {
									// eslint-disable-next-line no-console
									console.error(
										`[poison] ${method} WAIT TIMEOUT conn=${uid} state=${connection.state?.name} waited=${waited}ms ${blockerInfo(connection)}${dumpHistory(uid)}`,
									);
								}

								orig.call(connection, wrappedCallback, ...rest);
								return;
							}

							waited += STEP_MS;
							setTimeout(issueWhenReady, STEP_MS);
						};

						issueWhenReady();
						// knex ignores the return value of begin/commit/savepoint (callback-based), so deferring is safe.
						return undefined;
					}

					recordEvent(uid, `${method} issued state=${connection.state?.name} inflight="${priorQuery?.sql ?? 'none'}"`);
					return orig.call(this, wrappedCallback, ...rest);
				};
			}
		};

		const baseValidate = mssqlClient.validateConnection.bind(mssqlClient);

		mssqlClient.validateConnection = (connection: any) => {
			wrapTxnMethods(connection);
			const uid = connection?.__knexUid;
			const state = connection?.state?.name;
			const stillRunning = inFlight.get(uid);

			// stillRunning = the connection is being acquired while a query it issued hasn't finished, i.e.
			// it was released mid-query. The origin stack points at the Directus code that left it running.
			if (stillRunning || (state && state !== 'LoggedIn')) {
				// eslint-disable-next-line no-console
				console.error(
					`[poison] acquiring conn=${uid} state=${state} | in-flight: ${stillRunning?.sql ?? 'none'} | last op: ${lastOp.get(uid)}` +
						(stillRunning ? `\n  in-flight origin:${stillRunning.stack}` : ''),
				);
			}

			return baseValidate(connection);
		};
	}

	const times = new Map<string, number>();

	database
		.on('query', ({ __knexUid }: QueryInfo) => {
			times.set(__knexUid, performance.now());
		})
		.on('query-response', (_response, queryInfo: QueryInfo) => {
			const time = times.get(queryInfo.__knexUid);
			let delta;

			if (time) {
				delta = performance.now() - time;
				times.delete(queryInfo.__knexUid);

				metrics?.getDatabaseResponseMetric()?.observe(delta);
			}

			// eslint-disable-next-line no-nested-ternary
			const bindings = queryInfo.bindings
				? isArray(queryInfo.bindings)
					? queryInfo.bindings
					: Object.values(queryInfo.bindings)
				: [];

			logger.trace(`[${delta ? delta.toFixed(3) : '?'}ms] ${queryInfo.sql} [${bindings.join(', ')}]`);
		})
		.on('query-error', (_, queryInfo: QueryInfo) => {
			times.delete(queryInfo.__knexUid);
		});

	return database;
}

export function getSchemaInspector(database?: Knex): SchemaInspector {
	if (inspector) {
		return inspector;
	}

	database ??= getDatabase();

	inspector = createInspector(database);

	return inspector;
}

export async function hasDatabaseConnection(database?: Knex): Promise<boolean> {
	database = database ?? getDatabase();

	try {
		if (getDatabaseClient(database) === 'oracle') {
			await database.raw('select 1 from DUAL');
		} else {
			await database.raw('SELECT 1');
		}

		return true;
	} catch {
		return false;
	}
}

export async function validateDatabaseConnection(database?: Knex): Promise<void> {
	database = database ?? getDatabase();
	const logger = useLogger();

	try {
		if (getDatabaseClient(database) === 'oracle') {
			await database.raw('select 1 from DUAL');
		} else {
			await database.raw('SELECT 1');
		}
	} catch (error: any) {
		logger.error(`Can't connect to the database.`);
		logger.error(error);
		process.exit(1);
	}
}

export function getDatabaseClient(database?: Knex): DatabaseClient {
	database = database ?? getDatabase();

	switch (database.client.constructor.name) {
		case 'Client_MySQL2':
			return 'mysql';
		case 'Client_PG':
			return 'postgres';
		case 'Client_CockroachDB':
			return 'cockroachdb';
		case 'Client_SQLite3':
			return 'sqlite';
		case 'Client_Oracledb':
		case 'Client_Oracle':
			return 'oracle';
		case 'Client_MSSQL':
			return 'mssql';
		case 'Client_Redshift':
			return 'redshift';
	}

	throw new Error(`Couldn't extract database client`);
}

export async function isInstalled(): Promise<boolean> {
	const inspector = getSchemaInspector();

	// The existence of a directus_collections table alone isn't a "proper" check to see if everything
	// is installed correctly of course, but it's safe enough to assume that this collection only
	// exists when Directus is properly installed.
	return await inspector.hasTable('directus_collections');
}

export async function validateMigrations(): Promise<boolean> {
	const database = getDatabase();
	const logger = useLogger();

	try {
		let migrationFiles = await fse.readdir(path.join(__dirname, 'migrations'));

		const customMigrationsPath = path.resolve(getExtensionsPath(), 'migrations');

		let customMigrationFiles =
			((await fse.pathExists(customMigrationsPath)) && (await fse.readdir(customMigrationsPath))) || [];

		migrationFiles = migrationFiles.filter(
			(file: string) => file.startsWith('run') === false && file.endsWith('.d.ts') === false,
		);

		customMigrationFiles = customMigrationFiles.filter((file: string) => file.endsWith('.js'));

		migrationFiles.push(...customMigrationFiles);

		const requiredVersions = migrationFiles.map((filePath) => filePath.split('-')[0]);

		const completedVersions = (await database.select('version').from('directus_migrations')).map(
			({ version }) => version,
		);

		return requiredVersions.every((version) => completedVersions.includes(version));
	} catch (error: any) {
		logger.error(`Database migrations cannot be found`);
		logger.error(error);
		throw process.exit(1);
	}
}

/**
 * These database extensions should be optional, so we don't throw or return any problem states when they don't
 */
export async function validateDatabaseExtensions(): Promise<void> {
	const logger = useLogger();
	const database = getDatabase();
	const client = getDatabaseClient(database);
	const helpers = getHelpers(database);
	const geometrySupport = await helpers.st.supported();

	if (!geometrySupport) {
		switch (client) {
			case 'postgres':
				logger.warn(`PostGIS isn't installed. Geometry type support will be limited.`);
				break;
			case 'sqlite':
				logger.warn(`Spatialite isn't installed. Geometry type support will be limited.`);
				break;
			default:
				logger.warn(`Geometry type not supported on ${client}`);
				break;
		}
	}
}

async function validateDatabaseCharset(database?: Knex): Promise<void> {
	const env = useEnv();
	database = database ?? getDatabase();
	const logger = useLogger();

	if (getDatabaseClient(database) === 'mysql') {
		const { collation } = await database.select(database.raw(`@@collation_database as collation`)).first();

		const tables = await database('information_schema.tables')
			.select({ name: 'TABLE_NAME', collation: 'TABLE_COLLATION' })
			.where({ TABLE_SCHEMA: env['DB_DATABASE'] });

		const columns = await database('information_schema.columns')
			.select({ table_name: 'TABLE_NAME', name: 'COLUMN_NAME', collation: 'COLLATION_NAME' })
			.where({ TABLE_SCHEMA: env['DB_DATABASE'] })
			.whereNot({ COLLATION_NAME: collation });

		const excludedTables: string[] = toArray(env['DB_EXCLUDE_TABLES']);

		let inconsistencies = '';

		for (const table of tables) {
			if (excludedTables.includes(table.name)) continue;

			const tableColumns = columns.filter((column) => column.table_name === table.name);
			const tableHasInvalidCollation = table.collation !== collation;

			if (tableHasInvalidCollation || tableColumns.length > 0) {
				inconsistencies += `\t\t- Table "${table.name}": "${table.collation}"\n`;

				for (const column of tableColumns) {
					inconsistencies += `\t\t  - Column "${column.name}": "${column.collation}"\n`;
				}
			}
		}

		if (inconsistencies) {
			logger.warn(
				`Some tables and columns do not match your database's default collation (${collation}):\n${inconsistencies}`,
			);
		}
	}

	return;
}
