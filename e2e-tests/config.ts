import Dockerode from 'dockerode';
import { Knex } from 'knex';
import { allVendors } from './setup/utils/get-dbs-to-test';
import { customAlphabet } from 'nanoid';

const generateID = customAlphabet('abcdefghijklmnopqrstuvwxyz', 5);

type Vendor = typeof allVendors[number];

export type Config = {
	containerConfig: Record<Vendor, (Dockerode.ContainerSpec & { name: string }) | false>;
	knexConfig: Record<Vendor, Knex.Config & { waitTestSQL: string }>;
	ports: Record<Vendor, number>;
	names: Record<Vendor, string>;
};

export const processID = generateID();

const config: Config = {
	containerConfig: {
		postgres: {
			name: `directus-test-database-postgres-${process.pid}`,
			Image: 'postgres:12-alpine',
			Hostname: `directus-test-database-postgres-${process.pid}`,
			Env: ['POSTGRES_PASSWORD=secret', 'POSTGRES_DB=directus'],
		},
		mysql: {
			name: `directus-test-database-mysql-${process.pid}`,
			Image: 'mysql:8',
			Command: ['--default-authentication-plugin=mysql_native_password'],
			Hostname: `directus-test-database-mysql-${process.pid}`,
			Env: ['MYSQL_ROOT_PASSWORD=secret', 'MYSQL_DATABASE=directus'],
		},
		maria: {
			name: `directus-test-database-maria-${process.pid}`,
			Image: 'mariadb:10.5',
			Command: ['--default-authentication-plugin=maria_native_password'],
			Hostname: `directus-test-database-maria-${process.pid}`,
			Env: ['MYSQL_ROOT_PASSWORD=secret', 'MYSQL_DATABASE=directus'],
		},
		mssql: {
			name: `directus-test-database-mssql-${process.pid}`,
			Image: 'mcr.microsoft.com/mssql/server:2019-latest',
			Command: ['--default-authentication-plugin=mssql_native_password'],
			Hostname: `directus-test-database-mssql-${process.pid}`,
			Env: ['ACCEPT_EULA=Y', 'SA_PASSWORD=Test@123'],
		},
		oracle: {
			name: `directus-test-database-oracle-${process.pid}`,
			Image: 'quillbuilduser/oracle-18-xe-micro-sq',
			Command: ['--default-authentication-plugin=oracle_native_password'],
			Hostname: `directus-test-database-oracle-${process.pid}`,
			Env: [
				'OPATCH_JRE_MEMORY_OPTIONS=-Xms128m -Xmx256m -XX:PermSize=16m -XX:MaxPermSize=32m -Xss1m',
				'ORACLE_ALLOW_REMOTE=true',
			],
			// SHM-Size ?
		},
		sqlite3: false,
	},
	knexConfig: {
		postgres: {
			client: 'pg',
			connection: {
				host: `directus-test-database-postgres-${process.pid}`,
				port: 5432,
				user: 'postgres',
				password: 'secret',
				database: 'directus',
			},
			waitTestSQL: 'SELECT 1',
		},
		mysql: {
			client: 'mysql',
			connection: {
				host: `directus-test-database-mysql-${process.pid}`,
				port: 3306,
				user: 'root',
				password: 'secret',
				database: 'directus',
			},
			waitTestSQL: 'SELECT 1',
		},
		maria: {
			client: 'mysql',
			connection: {
				host: `directus-test-database-maria-${process.pid}`,
				port: 3306,
				user: 'root',
				password: 'secret',
				database: 'directus',
			},
			waitTestSQL: 'SELECT 1',
		},
		mssql: {
			client: 'tedious',
			connection: {
				host: `directus-test-database-mssql-${process.pid}`,
				port: 1433,
				user: 'sa',
				password: 'Test@123',
				database: 'directus',
			},
			waitTestSQL: 'SELECT 1',
		},
		oracle: {
			client: 'oracledb',
			connection: {
				user: 'secretsysuser',
				password: 'secretpassword',
				connectString: `localhost:5104/XE`,
			},
			waitTestSQL: 'SELECT 1 FROM DUAL',
		},
		sqlite3: {
			client: 'sqlite3',
			connection: {
				filename: './data.db',
			},
			waitTestSQL: 'SELECT 1',
		},
	},
	ports: {
		postgres: 6100,
		mysql: 6101,
		maria: 6102,
		mssql: 6103,
		oracle: 6104,
		sqlite3: 6105,
	},
	names: {
		postgres: 'Postgres',
		mysql: 'MySQL',
		maria: 'MariaDB',
		mssql: 'MS SQL Server',
		oracle: 'OracleDB',
		sqlite3: 'SQLite 3',
	},
};

export default config;
