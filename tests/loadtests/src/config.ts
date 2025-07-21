const directusConfig = {
	...process.env,
	ADMIN_EMAIL: 'admin@example.com',
	ADMIN_PASSWORD: 'password',
	ADMIN_TOKEN: 'admin',
	SECRET: 'directus-test',
	TELEMETRY: 'false',
	CACHE_SCHEMA: 'true',
	CACHE_SCHEMA_MAX_ITERATIONS: '100',
	CACHE_ENABLED: 'false',
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
	PORT: '8056',
	HOST: '127.0.0.1',
} as const;

const mariadb = {
	DB_CLIENT: 'mysql',
	DB_HOST: `127.0.0.1`,
	DB_USER: 'root',
	DB_PASSWORD: 'password',
	DB_PORT: '6100',
	DB_DATABASE: 'directus',
	...directusConfig,
} as const;

const postgres = {
	DB_CLIENT: 'pg',
	DB_HOST: `127.0.0.1`,
	DB_USER: 'postgres',
	DB_PASSWORD: 'secret',
	DB_PORT: '6100',
	DB_DATABASE: 'directus',
	...directusConfig,
} as const;

export const config = {
	mariadb,
	postgres,
} as const satisfies Record<string, Record<string, string>>;
