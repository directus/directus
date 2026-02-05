import { join } from 'path';
import { directusFolder } from './find-directus.js';
import type { Database, Options } from './sandbox.js';

const directusConfig = {
	TZ: 'UTC',
	ADMIN_EMAIL: 'admin@example.com',
	PROJECT_OWNER: 'admin@example.com',
	ADMIN_PASSWORD: 'pw',
	ADMIN_TOKEN: 'admin',
	SECRET: 'directus-test',
	TELEMETRY: 'false',
	CACHE_SCHEMA: 'true',
	CACHE_SCHEMA_MAX_ITERATIONS: '100',
	CONFIG_PATH: join(directusFolder, '.env'), // Override to non existent file so process envs aren't overwritten by file envs
	RATE_LIMITER_ENABLED: 'false',
	PRESSURE_LIMITER_ENABLED: 'false',
	LOG_LEVEL: 'info',
	SERVE_APP: 'true',
	DB_EXCLUDE_TABLES: 'knex_migrations,knex_migrations_lock,spatial_ref_sys,sysdiagrams',
	MAX_RELATIONAL_DEPTH: '5',
	MAX_PAYLOAD_SIZE: '10mb',
	EXTENSIONS_PATH: './extensions',
	ASSETS_TRANSFORM_MAX_CONCURRENT: '2',
	MAX_BATCH_MUTATION: '100', // Must be in multiples of 10 for tests
	QUERY_LIMIT_DEFAULT: '90', // Must be less than MAX_BATCH_MUTATION by at least 3
	ACCESS_TOKEN_TTL: '25d', // should be larger than 24.86 days to test Expires value larger than 32-bit signed integer
	WEBSOCKETS_ENABLED: 'true',
	HOST: '127.0.0.1',
	REDIS_HOST: '127.0.0.1',
	REDIS_PORT: '$PORT',
} as const;

const maria = {
	DB_CLIENT: 'mysql',
	DB_HOST: `127.0.0.1`,
	DB_USER: 'root',
	DB_PASSWORD: 'password',
	DB_PORT: '$PORT',
	DB_DATABASE: 'directus',
	DB_VERSION: '11',
	...directusConfig,
} as const;

const mssql = {
	DB_CLIENT: 'mssql',
	DB_HOST: `127.0.0.1`,
	DB_PORT: '$PORT',
	DB_USER: 'sa',
	DB_PASSWORD: 'Test@123',
	DB_DATABASE: 'model',
	DB_VERSION: '2022-latest',
	...directusConfig,
} as const;

const cockroachdb = {
	DB_CLIENT: 'cockroachdb',
	DB_HOST: `127.0.0.1`,
	DB_USER: 'root',
	DB_PASSWORD: '',
	DB_PORT: '$PORT',
	DB_DATABASE: 'defaultdb',
	DB_VERSION: 'latest-v25.3',
	COCKROACH_UI: '$PORT',
	...directusConfig,
} as const;

const mysql = {
	DB_CLIENT: 'mysql',
	DB_HOST: `127.0.0.1`,
	DB_PORT: '$PORT',
	DB_USER: 'root',
	DB_PASSWORD: 'secret',
	DB_DATABASE: 'directus',
	DB_VERSION: '8.4',
	...directusConfig,
} as const;

const postgres = {
	DB_CLIENT: 'pg',
	DB_HOST: `127.0.0.1`,
	DB_USER: 'postgres',
	DB_PASSWORD: 'secret',
	DB_PORT: '$PORT',
	DB_DATABASE: 'directus',
	DB_VERSION: '18-3.6-alpine',
	...directusConfig,
} as const;

const sqlite = {
	DB_CLIENT: 'sqlite3',
	DB_FILENAME: './test.db',
	...directusConfig,
} as const;

const oracle = {
	DB_CLIENT: 'oracledb',
	DB_HOST: '127.0.0.1',
	DB_PORT: '$PORT',
	DB_USER: 'secretsysuser',
	DB_PASSWORD: 'secretpassword',
	DB_DATABASE: 'XEPDB1',
	DB_VERSION: '21-slim-faststart' as string,
	...directusConfig,
} as const;

const saml = {
	SAML_PORT: '$PORT_SAML',
	AUTH_PROVIDERS: 'saml',
	AUTH_SAML_DRIVER: 'saml',
	AUTH_SAML_ALLOW_PUBLIC_REGISTRATION: 'true',
	AUTH_SAML_SP_metadata:
		'<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="saml-test"><md:SPSSODescriptor WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><md:KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>MIIDDTCCAfWgAwIBAgIJQC7RaeKX30qDMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNVBAMTGWRldi1md3h5bWRvMC51cy5hdXRoMC5jb20wHhcNMjIwODE5MjA1OTEwWhcNMzYwNDI3MjA1OTEwWjAkMSIwIAYDVQQDExlkZXYtZnd4eW1kbzAudXMuYXV0aDAuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA0TN0Doc8qop69i0bgGuynPQpJRat17xlsbphSWCnACc6DYbFBQ3n+cft8AiTzI7VISLazwlWOp30zhTMwZlrXMo1flG9qJl/2T+BLohRMw0ScCQk8Aq1cWRzZLb4Oku6PdefHrpsg6Wjn87m6R2Yrhmz33Vq2QYRwNsKhWRhhB2ajpMj8GsvFKG0FGPD/AJ1bGXcdsMOaQZxIiZ3Xcy9Ng8jAHvE12sIH8w14pmIidO15XFjlvtpNTxSl0qV0lmzKM0nN4EqlK0vTy4NwFk3xR/UmgQo5tYzqvRBqfzRO7vpOwbp1SWQ/c8JlI1ulLzt1uJzfvWsp8MSD/QRhxg93QIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBT60jtXFsHPoyL42prgUG7wQTaWcTAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAKFLvyUbywoLYLOtsgHv9S2qingx2Q2jmYChqj4CQxPaWRpS/qBaZXnjVETZrMFDjf8HyMf2qn9uwKvtJehfPXpG8D+VuZWfsriTn94pXuELbiekHZ0Qlo1acbjUwyIeKoMNMk7wjGe8qb4gar6noT6PvAbyv1uzzkdyIUmQDzSS/ZOdRW0cwHG6oD/PdzKOPZxUZtQcq23Y/hbK/JpDiKtt1oO/svpd6tMmi6VezVB47gvUqEKMB3B5PI2Rdn+lA9tFPY2tfZtzOPaT5YQJkpp7tAWdMaUir+M8BhY8EjgtK1ZhJ7h2pW+UuOwkNsikgbf9EoUvDDZak65rXNqCCpQ=</ds:X509Certificate></ds:X509Data></ds:KeyInfo></md:KeyDescriptor><md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat><md:AssertionConsumerService isDefault="true" index="0" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="http://host.docker.internal:8055/auth/login/saml/acs" /></md:SPSSODescriptor></md:EntityDescriptor>',
	AUTH_SAML_IDP_metadata:
		'<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" xmlns:ds="http://www.w3.org/2000/09/xmldsig#" entityID="http://127.0.0.1:$PORT_SAML/simplesaml/saml2/idp/metadata.php"><md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol"><md:KeyDescriptor use="signing"><ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJALmVVuDWu4NYMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNVBAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBXaWRnaXRzIFB0eSBMdGQwHhcNMTYxMjMxMTQzNDQ3WhcNNDgwNjI1MTQzNDQ3WjBFMQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzUCFozgNb1h1M0jzNRSCjhOBnR+uVbVpaWfXYIR+AhWDdEe5ryY+CgavOg8bfLybyzFdehlYdDRgkedEB/GjG8aJw06l0qF4jDOAw0kEygWCu2mcH7XOxRt+YAH3TVHa/Hu1W3WjzkobqqqLQ8gkKWWM27fOgAZ6GieaJBN6VBSMMcPey3HWLBmc+TYJmv1dbaO2jHhKh8pfKw0W12VM8P1PIO8gv4Phu/uuJYieBWKixBEyy0lHjyixYFCR12xdh4CA47q958ZRGnnDUGFVE1QhgRacJCOZ9bd5t9mr8KLaVBYTCJo5ERE8jymab5dPqe5qKfJsCZiqWglbjUo9twIDAQABo1AwTjAdBgNVHQ4EFgQUxpuwcs/CYQOyui+r1G+3KxBNhxkwHwYDVR0jBBgwFoAUxpuwcs/CYQOyui+r1G+3KxBNhxkwDAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQsFAAOCAQEAAiWUKs/2x/viNCKi3Y6blEuCtAGhzOOZ9EjrvJ8+COH3Rag3tVBWrcBZ3/uhhPq5gy9lqw4OkvEws99/5jFsX1FJ6MKBgqfuy7yh5s1YfM0ANHYczMmYpZeAcQf2CGAaVfwTTfSlzNLsF2lW/ly7yapFzlYSJLGoVE+OHEu8g5SlNACUEfkXw+5Eghh+KzlIN7R6Q7r2ixWNFBC/jWf7NKUfJyX8qIG5md1YUeT6GBW9Bm2/1/RiO24JTaYlfLdKK9TYb8sG5B+OLab2DImG99CJ25RkAcSobWNF5zD0O6lgOo3cEdB/ksCq3hmtlC/DlLZ/D8CJ+7VuZnS1rR2naQ==</ds:X509Certificate></ds:X509Data></ds:KeyInfo></md:KeyDescriptor><md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="http://127.0.0.1:$PORT_SAML/simplesaml/saml2/idp/SingleLogoutService.php" /><md:NameIDFormat>urn:oasis:names:tc:SAML:2.0:nameid-format:transient</md:NameIDFormat><md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="http://127.0.0.1:$PORT_SAML/simplesaml/saml2/idp/SSOService.php" /></md:IDPSSODescriptor></md:EntityDescriptor>',
	AUTH_SAML_DEFAULT_ROLE_ID: 'd70c0943-5b55-4c5d-a613-f539a27a57f5',
	AUTH_SAML_IDENTIFIER_KEY: 'uid',
	AUTH_SAML_EMAIL_KEY: 'email',
} as const;

const minio = {
	MINIO_PORT: '$PORT_MINIO',
	STORAGE_LOCATIONS: 'minio,local',
	STORAGE_MINIO_DRIVER: 's3',
	STORAGE_MINIO_KEY: 'directus',
	STORAGE_MINIO_SECRET: 'miniosecret',
	STORAGE_MINIO_BUCKET: 'directus-blackbox-test',
	STORAGE_MINIO_REGION: 'us-east-1',
	STORAGE_MINIO_ENDPOINT: 'http://127.0.0.1:$PORT_MINIO',
	STORAGE_MINIO_FORCE_PATH_STYLE: 'true',
} as const;

const maildev = {
	EMAIL_TRANSPORT: 'smtp',
	EMAIL_SMTP_HOST: '127.0.0.1',
	EMAIL_SMTP_PORT: '$PORT',
	EMAIL_SMTP_USER: 'admin@directus.io',
	EMAIL_SMTP_PASSWORD: 'password',
	MAILDEV_WEBUI: '$PORT',
};

const baseConfig = {
	maria,
	postgres,
	sqlite,
	cockroachdb,
	mssql,
	mysql,
	oracle,
} as const satisfies Record<Database, Record<string, string>>;

export async function getEnv(database: Database, opts: Options): Promise<Env> {
	const portMap: Record<string, string> = {};
	let portIndex = Number(opts.docker.basePort);

	async function getPort() {
		return String(typeof opts.docker.basePort === 'function' ? await opts.docker.basePort() : portIndex++);
	}

	const env = {
		...baseConfig[database],
		PORT: String(opts.port),
		PUBLIC_URL: `http://${baseConfig[database].HOST}:${opts.port}`,
		REDIS_ENABLED: String(opts.extras.redis),
		CACHE_ENABLED: String(opts.cache),
		NODE_ENV: opts.dev ? 'development' : 'production',
		...(opts.extras.minio ? minio : {}),
		...(opts.extras.saml ? saml : {}),
		...(opts.extras.maildev ? maildev : {}),
		...opts.env,
		...(process.env as Record<string, any>),
	} satisfies Env;

	if (opts.version && 'DB_VERSION' in env) {
		env.DB_VERSION = opts.version;
	}

	// eslint-disable-next-line prefer-const
	for (let [key, value] of Object.entries(env)) {
		const matches = /\$PORT(?:_[A-Z]+)*/gm.exec(value);

		for (const match of matches ?? []) {
			if (match === '$PORT') value = value.replaceAll(match, await getPort());

			if (match in portMap === false) {
				portMap[match] = await getPort();
			}

			value = value.replaceAll(match, portMap[match]!);
		}

		(env as any)[key] = value;
	}

	return env;
}

export type Env = (typeof baseConfig)[Database] & {
	PORT: string;
	REDIS_ENABLED: string;
	CACHE_ENABLED: string;
	PUBLIC_URL: string;
	NODE_ENV: string;
} & Partial<typeof minio> &
	Partial<typeof saml> &
	Partial<typeof maildev>;
