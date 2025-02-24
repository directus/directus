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

	IMPORT_IP_DENY_LIST: 'array',

	FILE_METADATA_ALLOW_LIST: 'array',

	GRAPHQL_INTROSPECTION: 'boolean',

	MAX_BATCH_MUTATION: 'number',

	SERVER_SHUTDOWN_TIMEOUT: 'number',

	LOG_HTTP_IGNORE_PATHS: 'array',

	REDIS_ENABLED: 'boolean',

	METRICS_TOKENS: 'array',
	METRICS_SERVICES: 'array',

	DB_SSL__CA_FILE: 'string',
} as const;
