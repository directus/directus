import { Knex } from 'knex';
import { promisify } from 'util';
import { allVendors } from './get-dbs-to-test';

type Vendor = typeof allVendors[number];

export type Config = {
	knexConfig: Record<Vendor, Knex.Config & { waitTestSQL: string }>;
	names: Record<Vendor, string>;
	envs: Record<Vendor, Record<string, string>>;
};

const migrationsDir = './tests/e2e/setup/migrations';
const seedsDir = './tests/e2e/setup/seeds';

const knexConfig = {
	waitTestSQL: 'SELECT 1',
	migrations: {
		directory: migrationsDir,
	},
	seeds: {
		directory: seedsDir,
	},
};

const directusConfig = {
	...process.env,
	ADMIN_EMAIL: 'admin@example.com',
	ADMIN_PASSWORD: 'password',
	KEY: 'directus-test',
	SECRET: 'directus-test',
	TELEMETRY: 'false',
	CACHE_SCHEMA: 'false',
	CACHE_ENABLED: 'false',
	RATE_LIMITER_ENABLED: 'false',
	LOG_LEVEL: 'error',
	SERVE_APP: 'false',
};

const config: Config = {
	knexConfig: {
		postgres: {
			client: 'pg',
			connection: {
				database: 'directus',
				user: 'postgres',
				password: 'secret',
				host: 'localhost',
				port: 6100,
			},
			...knexConfig,
		},
		postgres10: {
			client: 'pg',
			connection: {
				database: 'directus',
				user: 'postgres',
				password: 'secret',
				host: 'localhost',
				port: 6101,
			},
			...knexConfig,
		},
		mysql: {
			client: 'mysql',
			connection: {
				database: 'directus',
				user: 'root',
				password: 'secret',
				host: 'localhost',
				port: 6102,
			},
			...knexConfig,
		},
		maria: {
			client: 'mysql',
			connection: {
				database: 'directus',
				user: 'root',
				password: 'secret',
				host: 'localhost',
				port: 6103,
			},
			...knexConfig,
		},
		mssql: {
			client: 'mssql',
			connection: {
				database: 'model',
				user: 'sa',
				password: 'Test@123',
				host: 'localhost',
				port: 6104,
				requestTimeout: 30000,
			},
			...knexConfig,
		},
		oracle: {
			client: 'oracledb',
			connection: {
				user: 'secretsysuser',
				password: 'secretpassword',
				connectString: 'localhost:6105/XE',
			},
			...knexConfig,
			waitTestSQL: 'SELECT 1 FROM DUAL',
		},
		cockroachdb: {
			client: 'cockroachdb',
			connection: {
				database: 'defaultdb',
				user: 'root',
				password: '',
				host: 'localhost',
				port: 6106,
			},
			pool: {
				afterCreate: async (conn: any, callback: any) => {
					const run = promisify(conn.query.bind(conn));
					await run('SET serial_normalization = "sql_sequence"');
					await run('SET default_int_size = 4');
					callback(null, conn);
				},
			},
			...knexConfig,
		},
		sqlite3: {
			client: 'sqlite3',
			connection: {
				filename: './test.db',
			},
			useNullAsDefault: true,
			pool: {
				afterCreate: async (conn: any, callback: any) => {
					const run = promisify(conn.run.bind(conn));
					await run('PRAGMA foreign_keys = ON');
					callback(null, conn);
				},
			},
			...knexConfig,
		},
	},
	names: {
		postgres: 'Postgres',
		postgres10: 'Postgres (10)',
		mysql: 'MySQL',
		maria: 'MariaDB',
		mssql: 'MS SQL Server',
		oracle: 'OracleDB',
		sqlite3: 'SQLite 3',
		cockroachdb: 'CockroachDB',
	},
	envs: {
		postgres: {
			...directusConfig,
			DB_CLIENT: 'pg',
			DB_HOST: `localhost`,
			DB_USER: 'postgres',
			DB_PASSWORD: 'secret',
			DB_PORT: '6100',
			DB_DATABASE: 'directus',
			PORT: '59152',
		},
		postgres10: {
			...directusConfig,
			DB_CLIENT: 'pg',
			DB_HOST: `localhost`,
			DB_USER: 'postgres',
			DB_PASSWORD: 'secret',
			DB_PORT: '6101',
			DB_DATABASE: 'directus',
			PORT: '59153',
		},
		mysql: {
			...directusConfig,
			DB_CLIENT: 'mysql',
			DB_HOST: `localhost`,
			DB_PORT: '6102',
			DB_USER: 'root',
			DB_PASSWORD: 'secret',
			DB_DATABASE: 'directus',
			PORT: '59154',
		},
		maria: {
			...directusConfig,
			DB_CLIENT: 'mysql',
			DB_HOST: `localhost`,
			DB_PORT: '6103',
			DB_USER: 'root',
			DB_PASSWORD: 'secret',
			DB_DATABASE: 'directus',
			PORT: '59155',
		},
		mssql: {
			...directusConfig,
			DB_CLIENT: 'mssql',
			DB_HOST: `localhost`,
			DB_PORT: '6104',
			DB_USER: 'sa',
			DB_PASSWORD: 'Test@123',
			DB_DATABASE: 'model',
			PORT: '59156',
		},
		oracle: {
			...directusConfig,
			DB_CLIENT: 'oracledb',
			DB_USER: 'secretsysuser',
			DB_PASSWORD: 'secretpassword',
			DB_CONNECT_STRING: `localhost:6105/XE`,
			PORT: '59157',
		},
		sqlite3: {
			...directusConfig,
			DB_CLIENT: 'sqlite3',
			DB_FILENAME: './test.db',
			PORT: '59158',
		},
		cockroachdb: {
			...directusConfig,
			DB_CLIENT: 'cockroachdb',
			DB_HOST: `localhost`,
			DB_USER: 'root',
			DB_PASSWORD: '',
			DB_PORT: '6106',
			DB_DATABASE: 'defaultdb',
			PORT: '59159',
		},
	},
};

export default config;
