import { Knex } from 'knex';
import path from 'node:path';
import { promisify } from 'util';
import { allVendors } from './get-dbs-to-test';

type Vendor = (typeof allVendors)[number];

export type Env = Record<Vendor, Record<string, string>>;
export type Config = {
	knexConfig: Record<Vendor, Knex.Config & { waitTestSQL: string }>;
	names: Record<Vendor, string>;
	envs: Env;
};

export const paths = {
	cli: path.join(__dirname, '..', '..', '..', 'dist', 'cli'),
	cwd: path.join(__dirname, '..'),
};

const migrationsDir = './setup/migrations';
const seedsDir = './setup/seeds';

const knexConfig = {
	waitTestSQL: 'SELECT 1',
	migrations: {
		directory: migrationsDir,
	},
	seeds: {
		directory: seedsDir,
	},
};

const allowedLogLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

let logLevel = 'error';

if (process.env.TEST_SAVE_LOGS) {
	logLevel = allowedLogLevels.includes(process.env.TEST_SAVE_LOGS) ? process.env.TEST_SAVE_LOGS : 'info';
}

const directusAuthConfig = {
	AUTH_PROVIDERS: 'saml',
	AUTH_SAML_DRIVER: 'saml',
	AUTH_SAML_ALLOW_PUBLIC_REGISTRATION: 'true',
	AUTH_SAML_SP_metadata:
		'<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="saml-test"><md:SPSSODescriptor WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><md:KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>MIIDDTCCAfWgAwIBAgIJQC7RaeKX30qDMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNVBAMTGWRldi1md3h5bWRvMC51cy5hdXRoMC5jb20wHhcNMjIwODE5MjA1OTEwWhcNMzYwNDI3MjA1OTEwWjAkMSIwIAYDVQQDExlkZXYtZnd4eW1kbzAudXMuYXV0aDAuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0TN0Doc8qop69i0bgGuynPQpJRat17xlsbphSWCnACc6DYbFBQ3n+cft8AiTzI7VISLazwlWOp30zhTMwZlrXMo1flG9qJl/2T+BLohRMw0ScCQk8Aq1cWRzZLb4Oku6PdefHrpsg6Wjn87m6R2Yrhmz33Vq2QYRwNsKhWRhhB2ajpMj8GsvFKG0FGPD/AJ1bGXcdsMOaQZxIiZ3Xcy9Ng8jAHvE12sIH8w14pmIidO15XFjlvtpNTxSl0qV0lmzKM0nN4EqlK0vTy4NwFk3xR/UmgQo5tYzqvRBqfzRO7vpOwbp1SWQ/c8JlI1ulLzt1uJzfvWsp8MSD/QRhxg93QIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBT60jtXFsHPoyL42prgUG7wQTaWcTAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAKFLvyUbywoLYLOtsgHv9S2qingx2Q2jmYChqj4CQxPaWRpS/qBaZXnjVETZrMFDjf8HyMf2qn9uwKvtJehfPXpG8D+VuZWfsriTn94pXuELbiekHZ0Qlo1acbjUwyIeKoMNMk7wjGe8qb4gar6noT6PvAbyv1uzzkdyIUmQDzSS/ZOdRW0cwHG6oD/PdzKOPZxUZtQcq23Y/hbK/JpDiKtt1oO/svpd6tMmi6VezVB47gvUqEKMB3B5PI2Rdn+lA9tFPY2tfZtzOPaT5YQJkpp7tAWdMaUir+M8BhY8EjgtK1ZhJ7h2pW+UuOwkNsikgbf9EoUvDDZak65rXNqCCpQ=</ds:X509Certificate></ds:X509Data></ds:KeyInfo></md:KeyDescriptor><md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat><md:AssertionConsumerService isDefault="true" index="0" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="http://host.docker.internal:8055/auth/login/saml/acs" /></md:SPSSODescriptor></md:EntityDescriptor>',
	AUTH_SAML_IDP_metadata:
		'<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="http://127.0.0.1:8880/simplesaml/saml2/idp/metadata.php"><md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><md:KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==</ds:X509Certificate></ds:X509Data></ds:KeyInfo></md:KeyDescriptor><md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="http://127.0.0.1:8880/simplesaml/saml2/idp/SingleLogoutService.php" /><md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat><md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="http://127.0.0.1:8880/simplesaml/saml2/idp/SSOService.php" /></md:IDPSSODescriptor></md:EntityDescriptor>',
	AUTH_SAML_DEFAULT_ROLE_ID: 'd70c0943-5b55-4c5d-a613-f539a27a57f5',
	AUTH_SAML_IDENTIFIER_KEY: 'uid',
	AUTH_SAML_EMAIL_KEY: 'email',
};

const directusStorageConfig = {
	STORAGE_LOCATIONS: 'local,minio',
	STORAGE_MINIO_DRIVER: 's3',
	STORAGE_MINIO_KEY: 'directus',
	STORAGE_MINIO_SECRET: 'miniosecret',
	STORAGE_MINIO_BUCKET: 'directus-blackbox-test',
	STORAGE_MINIO_REGION: 'us-east-1',
	STORAGE_MINIO_ENDPOINT: 'http://localhost:8881',
	STORAGE_MINIO_FORCE_PATH_STYLE: 'true',
};

const directusConfig = {
	...process.env,
	ADMIN_EMAIL: 'admin@example.com',
	ADMIN_PASSWORD: 'password',
	KEY: 'directus-test',
	SECRET: 'directus-test',
	TELEMETRY: 'false',
	CACHE_SCHEMA: 'true',
	CACHE_ENABLED: 'false',
	RATE_LIMITER_ENABLED: 'false',
	PRESSURE_LIMITER_ENABLED: 'false',
	LOG_LEVEL: logLevel,
	SERVE_APP: 'false',
	DB_EXCLUDE_TABLES: 'knex_migrations,knex_migrations_lock,spatial_ref_sys,sysdiagrams',
	MAX_RELATIONAL_DEPTH: '5',
	MAX_PAYLOAD_SIZE: '10mb',
	EXTENSIONS_PATH: './extensions',
	ASSETS_TRANSFORM_MAX_CONCURRENT: '2',
	MAX_BATCH_MUTATION: '100', // Must be in multiples of 10 for tests
	ACCESS_TOKEN_TTL: '25d', // should be larger than 24.86 days to test Expires value larger than 32-bit signed integer
	...directusAuthConfig,
	...directusStorageConfig,
};

const config: Config = {
	knexConfig: {
		postgres: {
			client: 'pg',
			connection: {
				database: 'directus',
				user: 'postgres',
				password: 'secret',
				host: '127.0.0.1',
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
				host: '127.0.0.1',
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
				host: '127.0.0.1',
				port: 6102,
			},
			...knexConfig,
		},
		mysql5: {
			client: 'mysql',
			connection: {
				database: 'directus',
				user: 'root',
				password: 'secret',
				host: '127.0.0.1',
				port: 6103,
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
				port: 6104,
			},
			...knexConfig,
		},
		mssql: {
			client: 'mssql',
			connection: {
				database: 'model',
				user: 'sa',
				password: 'Test@123',
				host: '127.0.0.1',
				port: 6105,
				requestTimeout: 60000,
			},
			...knexConfig,
		},
		oracle: {
			client: 'oracledb',
			connection: {
				user: 'secretsysuser',
				password: 'secretpassword',
				connectString: '127.0.0.1:6106/XE',
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
				host: '127.0.0.1',
				port: 6107,
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
		mysql5: 'MySQL (5)',
		maria: 'MariaDB',
		mssql: 'MS SQL Server',
		oracle: 'OracleDB',
		cockroachdb: 'CockroachDB',
		sqlite3: 'SQLite 3',
	},
	envs: {
		postgres: {
			...directusConfig,
			DB_CLIENT: 'pg',
			DB_HOST: `127.0.0.1`,
			DB_USER: 'postgres',
			DB_PASSWORD: 'secret',
			DB_PORT: '6100',
			DB_DATABASE: 'directus',
			PORT: '59152',
		},
		postgres10: {
			...directusConfig,
			DB_CLIENT: 'pg',
			DB_HOST: `127.0.0.1`,
			DB_USER: 'postgres',
			DB_PASSWORD: 'secret',
			DB_PORT: '6101',
			DB_DATABASE: 'directus',
			PORT: '59153',
		},
		mysql: {
			...directusConfig,
			DB_CLIENT: 'mysql',
			DB_HOST: `127.0.0.1`,
			DB_PORT: '6102',
			DB_USER: 'root',
			DB_PASSWORD: 'secret',
			DB_DATABASE: 'directus',
			PORT: '59154',
		},
		mysql5: {
			...directusConfig,
			DB_CLIENT: 'mysql',
			DB_HOST: `127.0.0.1`,
			DB_PORT: '6103',
			DB_USER: 'root',
			DB_PASSWORD: 'secret',
			DB_DATABASE: 'directus',
			PORT: '59155',
		},
		maria: {
			...directusConfig,
			DB_CLIENT: 'mysql',
			DB_HOST: `localhost`,
			DB_PORT: '6104',
			DB_USER: 'root',
			DB_PASSWORD: 'secret',
			DB_DATABASE: 'directus',
			PORT: '59156',
		},
		mssql: {
			...directusConfig,
			DB_CLIENT: 'mssql',
			DB_HOST: `127.0.0.1`,
			DB_PORT: '6105',
			DB_USER: 'sa',
			DB_PASSWORD: 'Test@123',
			DB_DATABASE: 'model',
			PORT: '59157',
		},
		oracle: {
			...directusConfig,
			DB_CLIENT: 'oracledb',
			DB_USER: 'secretsysuser',
			DB_PASSWORD: 'secretpassword',
			DB_CONNECT_STRING: `127.0.0.1:6106/XE`,
			PORT: '59158',
		},
		cockroachdb: {
			...directusConfig,
			DB_CLIENT: 'cockroachdb',
			DB_HOST: `127.0.0.1`,
			DB_USER: 'root',
			DB_PASSWORD: '',
			DB_PORT: '6107',
			DB_DATABASE: 'defaultdb',
			PORT: '59159',
		},
		sqlite3: {
			...directusConfig,
			DB_CLIENT: 'sqlite3',
			DB_FILENAME: './test.db',
			PORT: '59160',
		},
	},
};

const isWindows = ['win32', 'win64'].includes(process.platform);

for (const vendor of allVendors) {
	config.envs[vendor]!.TZ = isWindows ? '0' : 'UTC';
}

export function getUrl(vendor: (typeof allVendors)[number], overrideEnv?: Env) {
	let port = overrideEnv ? overrideEnv[vendor]!.PORT : config.envs[vendor]!.PORT;

	if (process.env.TEST_LOCAL) {
		port = '8055';
	} else if (process.env.TEST_NO_CACHE) {
		port = String(parseInt(config.envs[vendor]!.PORT) + 50);
	}

	return `http://127.0.0.1:${port}`;
}

export default config;
