import { promisify } from 'util';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Knex from 'knex';

export enum Db {
	PostgresSQL = 'postgres',
	MySQL = 'mysql',
	MySQL2 = 'mysql2',
	MSSQL = 'mssql',
	SQLite = 'sqlite',
}

export function getAllDbs(): Db[] {
	return [Db.SQLite] || Object.values(Db);
}

const pool = {
	afterCreate: function (connection: any, callback: CallableFunction) {
		callback(null, connection);
	},
};

const poolSqlite = {
	min: 0,
	max: 1,
	acquireTimeoutMillis: 1000,
	afterCreate: function (connection: any, callback: CallableFunction) {
		connection.run('PRAGMA foreign_keys = ON', callback);
	},
};

const mysqlPool = Object.assign({}, pool, {
	afterCreate: function (connection: any, callback: CallableFunction) {
		promisify(connection.query)
			.call(connection, "SET sql_mode='TRADITIONAL';", [])
			.then(function () {
				callback(null, connection);
			});
	},
});

const migrations = {
	directory: 'test/integration/migrate/migration',
};

const seeds = {
	directory: 'test/integration/seed/seeds',
};

const testConfigs: Record<Db, Record<string, any>> = {
	mysql: {
		client: 'mysql',
		connection: {
			port: 23306,
			database: 'knex_test',
			host: 'localhost',
			user: 'testuser',
			password: 'testpassword',
			charset: 'utf8',
		},
		pool: mysqlPool,
		migrations,
		seeds,
	},

	mysql2: {
		client: 'mysql2',
		connection: {
			port: 23306,
			database: 'knex_test',
			host: 'localhost',
			user: 'testuser',
			password: 'testpassword',
			charset: 'utf8',
		},
		pool: mysqlPool,
		migrations,
		seeds,
	},

	postgres: {
		client: 'postgres',
		connection: {
			adapter: 'postgresql',
			port: 25432,
			host: 'localhost',
			database: 'knex_test',
			user: 'testuser',
			password: 'knextest',
		},
		pool,
		migrations,
		seeds,
	},

	sqlite: {
		client: 'sqlite3',
		connection: ':memory:',
		pool: poolSqlite,
		migrations,
		seeds,
	},

	mssql: {
		client: 'mssql',
		connection: {
			user: 'sa',
			password: 'S0meVeryHardPassword',
			server: 'localhost',
			port: 21433,
			database: 'knex_test',
		},
		pool: pool,
		migrations,
		seeds,
	},
};

export function getKnexForDb(db: Db): Knex {
	const config = testConfigs[db];
	return Knex(config);
}
