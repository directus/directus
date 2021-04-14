import Dockerode from 'dockerode';
import { Knex } from 'knex';
import { allVendors } from './get-dbs-to-test';
import { customAlphabet } from 'nanoid';

const generateID = customAlphabet('abcdefghijklmnopqrstuvwxyz', 5);

type Vendor = typeof allVendors[number];

export type Config = {
	containerConfig: Record<
		Vendor,
		(Dockerode.ContainerSpec & Dockerode.ContainerCreateOptions & { name: string }) | false
	>;
	knexConfig: Record<Vendor, Knex.Config & { waitTestSQL: string }>;
	ports: Record<Vendor, number>;
	names: Record<Vendor, string>;
	envs: Record<Vendor, string[]>;
};

export const processID = generateID();

export const CONTAINER_PERSISTENCE_FILE = '.e2e-containers.json';

const config: Config = {
	containerConfig: {
		postgres: {
			name: `directus-test-database-postgres-${process.pid}`,
			Image: 'postgres:12-alpine',
			Hostname: `directus-test-database-postgres-${process.pid}`,
			Env: ['POSTGRES_PASSWORD=secret', 'POSTGRES_DB=directus'],
			HostConfig: {
				PortBindings: {
					'5432/tcp': [{ HostPort: '6000' }],
				},
			},
		},
		mysql: {
			name: `directus-test-database-mysql-${process.pid}`,
			Image: 'mysql:8',
			Cmd: ['--default-authentication-plugin=mysql_native_password'],
			Hostname: `directus-test-database-mysql-${process.pid}`,
			Env: ['MYSQL_ROOT_PASSWORD=secret', 'MYSQL_DATABASE=directus'],
			HostConfig: {
				PortBindings: {
					'3306/tcp': [{ HostPort: '6001' }],
				},
			},
		},
		maria: {
			name: `directus-test-database-maria-${process.pid}`,
			Image: 'mariadb:10.5',
			Hostname: `directus-test-database-maria-${process.pid}`,
			Env: ['MYSQL_ROOT_PASSWORD=secret', 'MYSQL_DATABASE=directus'],
			HostConfig: {
				PortBindings: {
					'3306/tcp': [{ HostPort: '6002' }],
				},
			},
		},
		mssql: {
			name: `directus-test-database-mssql-${process.pid}`,
			Image: 'mcr.microsoft.com/mssql/server:2019-latest',
			Hostname: `directus-test-database-mssql-${process.pid}`,
			Env: ['ACCEPT_EULA=Y', 'SA_PASSWORD=Test@123'],
			HostConfig: {
				PortBindings: {
					'1433/tcp': [{ HostPort: '6003' }],
				},
			},
		},
		oracle: {
			name: `directus-test-database-oracle-${process.pid}`,
			Image: 'quillbuilduser/oracle-18-xe-micro-sq',
			Hostname: `directus-test-database-oracle-${process.pid}`,
			Env: [
				'OPATCH_JRE_MEMORY_OPTIONS=-Xms128m -Xmx256m -XX:PermSize=16m -XX:MaxPermSize=32m -Xss1m',
				'ORACLE_ALLOW_REMOTE=true',
			],
			HostConfig: {
				PortBindings: {
					'1521/tcp': [{ HostPort: '6004' }],
				},
			},
		},
		sqlite3: false,
	},
	knexConfig: {
		postgres: {
			client: 'pg',
			connection: {
				host: 'localhost',
				port: 6000,
				user: 'postgres',
				password: 'secret',
				database: 'directus',
			},
			waitTestSQL: 'SELECT 1',
		},
		mysql: {
			client: 'mysql',
			connection: {
				host: 'localhost',
				port: 6001,
				user: 'root',
				password: 'secret',
				database: 'directus',
			},
			waitTestSQL: 'SELECT 1',
		},
		maria: {
			client: 'mysql',
			connection: {
				host: 'localhost',
				port: 6002,
				user: 'root',
				password: 'secret',
				database: 'directus',
			},
			waitTestSQL: 'SELECT 1',
		},
		mssql: {
			client: 'mssql',
			connection: {
				host: 'localhost',
				port: 6003,
				user: 'sa',
				password: 'Test@123',
				database: 'model',
			},
			waitTestSQL: 'SELECT 1',
		},
		oracle: {
			client: 'oracledb',
			connection: {
				user: 'secretsysuser',
				password: 'secretpassword',
				connectString: 'localhost:6004/XE',
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
	envs: {
		postgres: [
			'DB_CLIENT=pg',
			`DB_HOST=directus-test-database-postgres-${process.pid}`,
			'DB_USER=postgres',
			'DB_PASSWORD=secret',
			'DB_PORT=5432',
			'DB_DATABASE=directus',
		],
		mysql: [
			'DB_CLIENT=mysql',
			`DB_HOST=directus-test-database-mysql-${process.pid}`,
			'DB_PORT=3306',
			'DB_USER=root',
			'DB_PASSWORD=secret',
			'DB_DATABASE=directus',
		],
		maria: [
			'DB_CLIENT=mysql',
			`DB_HOST=directus-test-database-maria-${process.pid}`,
			'DB_PORT=3306',
			'DB_USER=root',
			'DB_PASSWORD=secret',
			'DB_DATABASE=directus',
		],
		mssql: [
			'DB_CLIENT=mssql',
			`DB_HOST=directus-test-database-mssql-${process.pid}`,
			'DB_PORT=1433',
			'DB_USER=sa',
			'DB_PASSWORD=Test@123',
			'DB_DATABASE=model',
		],
		oracle: [
			'DB_CLIENT=oracledb',
			'DB_USER=secretsysuser',
			'DB_PASSWORD=secretpassword',
			`DB_CONNECT_STRING=directus-test-database-oracle-${process.pid}:1521/XE`,
		],
		sqlite3: ['DB_CLIENT=sqlite3', 'DB_FILENAME=./data.db'],
	},
};

export default config;
