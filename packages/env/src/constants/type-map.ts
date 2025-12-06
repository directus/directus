import type { EnvType } from '../types/env-type.js';

/**
 * Environment variables that we expect to be in a certain type. Will set the default casting of
 * those values
 */
export const TYPE_MAP: Record<string, EnvType> = {
	HOST: 'string',
	PORT: 'string',

	DB_NAME: 'string',
	DB_USER: 'string',
	DB_PASSWORD: 'string',
	DB_DATABASE: 'string',
	DB_PORT: 'number',

	DB_EXCLUDE_TABLES: 'array',

	CACHE_SKIP_ALLOWED: 'boolean',
	CACHE_AUTO_PURGE_IGNORE_LIST: 'array',
	CACHE_SCHEMA_MAX_ITERATIONS: 'number',
	CACHE_SCHEMA_SYNC_TIMEOUT: 'number',
	CACHE_SCHEMA_FREEZE_ENABLED: 'boolean',

	OPENTELEMETRY_ENABLED: 'boolean',

	IMPORT_IP_DENY_LIST: 'array',

	FILE_METADATA_ALLOW_LIST: 'array',

	GRAPHQL_INTROSPECTION: 'boolean',
	GRAPHQL_SCHEMA_GENERATION_MAX_CONCURRENT: 'number',

	MAX_BATCH_MUTATION: 'number',
	MAX_IMPORT_ERRORS: 'number',

	SERVER_SHUTDOWN_TIMEOUT: 'number',

	LOG_HTTP_IGNORE_PATHS: 'array',

	REDIS_ENABLED: 'boolean',

	METRICS_TOKENS: 'array',
	METRICS_SERVICES: 'array',

	DB_SSL__CA_FILE: 'string',

	ADMIN_PASSWORD: 'string',
	ADMIN_TOKEN: 'string',
	KEY: 'string',
	SECRET: 'string',

	EXTENSIONS_ROLLDOWN: 'boolean',
	EMAIL_SMTP_PASSWORD: 'string',
	REDIS_PASSWORD: 'string',
	'AUTH_.+_BIND_PASSWORD': 'string',
	'STORAGE_.+_SECRET': 'string',
} as const;

export const TYPE_MAP_REGEX: [RegExp, EnvType][] = Object.entries(TYPE_MAP).map(([name, value]) => [
	new RegExp(`^${name}$`),
	value,
]);
