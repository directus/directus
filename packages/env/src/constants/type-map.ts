import type { EnvType } from '../types/env-type.js';

/**
 * Environment variables that we expect to be in a certain type. Will set the default casting of
 * those values.
 *
 * Mirrors the order of the defaults, so that every variable with a default has a known type. The
 * following variables are intentionally left out, as they accept multiple types and therefore have
 * to be cast based on the shape of the configured value:
 *
 * - `CORS_ORIGIN`: `true` to reflect the request origin, or the allowed origin(s)
 * - `IP_TRUST_PROXY`: a boolean, hop count, or comma separated list of trusted addresses
 * - `IP_CUSTOM_HEADER`: `false` to disable, or the name of the header to read the IP from
 * - `TUS_CHUNK_SIZE`: a number of bytes, or a human readable size like `10mb`
 */
export const TYPE_MAP = {
	LOG_LEVEL: 'string',
	LOG_STYLE: 'string',

	CONFIG_PATH: 'string',
	UNIX_SOCKET_PATH: 'string',

	HOST: 'string',
	PORT: 'number',
	PUBLIC_URL: 'string',
	MAX_PAYLOAD_SIZE: 'string',
	MAX_RELATIONAL_DEPTH: 'number',
	MAX_JSON_QUERY_DEPTH: 'number',
	QUERYSTRING_MAX_PARSE_DEPTH: 'number',
	QUERYSTRING_ARRAY_LIMIT: 'number',
	QUERY_LIMIT_DEFAULT: 'number',
	MAX_BATCH_MUTATION: 'number',
	MAX_IMPORT_ERRORS: 'number',
	ROBOTS_TXT: 'string',
	SERVE_APP: 'boolean',
	SERVER_SHUTDOWN_TIMEOUT: 'number',
	ACCEPT_TERMS: 'boolean',

	PROJECT_NAME: 'string',
	PROJECT_OWNER: 'string',

	ROOT_REDIRECT: 'string',

	TEMP_PATH: 'string',
	PACKAGE_FILE_LOCATION: 'string',
	MIGRATIONS_PATH: 'string',

	DB_NAME: 'string',
	DB_USER: 'string',
	DB_PASSWORD: 'string',
	DB_DATABASE: 'string',
	DB_PORT: 'number',
	DB_EXCLUDE_TABLES: 'string-array',
	DB_SSL__CA_FILE: 'string',

	STORAGE_LOCATIONS: 'string-array',
	STORAGE_LOCAL_DRIVER: 'string',
	STORAGE_LOCAL_ROOT: 'string',

	RATE_LIMITER_ENABLED: 'boolean',
	RATE_LIMITER_POINTS: 'number',
	RATE_LIMITER_DURATION: 'number',
	RATE_LIMITER_STORE: 'string',

	RATE_LIMITER_GLOBAL_ENABLED: 'boolean',
	RATE_LIMITER_GLOBAL_POINTS: 'number',
	RATE_LIMITER_GLOBAL_DURATION: 'number',

	RATE_LIMITER_REGISTRATION_ENABLED: 'boolean',
	RATE_LIMITER_REGISTRATION_POINTS: 'number',
	RATE_LIMITER_REGISTRATION_DURATION: 'number',

	RATE_LIMITER_MCP_OAUTH_ENABLED: 'boolean',
	RATE_LIMITER_MCP_OAUTH_POINTS: 'number',
	RATE_LIMITER_MCP_OAUTH_DURATION: 'number',

	RATE_LIMITER_MCP_OAUTH_REGISTRATION_ENABLED: 'boolean',
	RATE_LIMITER_MCP_OAUTH_REGISTRATION_POINTS: 'number',
	RATE_LIMITER_MCP_OAUTH_REGISTRATION_DURATION: 'number',

	RATE_LIMITER_EMAIL_ENABLED: 'boolean',
	RATE_LIMITER_EMAIL_POINTS: 'number',
	RATE_LIMITER_EMAIL_DURATION: 'number',
	RATE_LIMITER_EMAIL_QUEUE_SIZE: 'number',
	RATE_LIMITER_EMAIL_ERROR_MESSAGE: 'string',

	RATE_LIMITER_EMAIL_FLOWS_ENABLED: 'boolean',
	RATE_LIMITER_EMAIL_FLOWS_POINTS: 'number',
	RATE_LIMITER_EMAIL_FLOWS_DURATION: 'number',
	RATE_LIMITER_EMAIL_FLOWS_ERROR_MESSAGE: 'string',

	PRESSURE_LIMITER_ENABLED: 'boolean',
	PRESSURE_LIMITER_SAMPLE_INTERVAL: 'number',
	PRESSURE_LIMITER_MAX_EVENT_LOOP_UTILIZATION: 'number',
	PRESSURE_LIMITER_MAX_EVENT_LOOP_DELAY: 'number',
	PRESSURE_LIMITER_RETRY_AFTER: 'string',
	PRESSURE_LIMITER_MAX_MEMORY_RSS: 'number',
	PRESSURE_LIMITER_MAX_MEMORY_HEAP_USED: 'number',

	ACCESS_TOKEN_TTL: 'string',
	EMAIL_VERIFICATION_TOKEN_TTL: 'string',
	USER_INVITE_TOKEN_TTL: 'string',

	REFRESH_TOKEN_TTL: 'string',
	REFRESH_TOKEN_COOKIE_NAME: 'string',
	REFRESH_TOKEN_COOKIE_SECURE: 'boolean',
	REFRESH_TOKEN_COOKIE_SAME_SITE: 'string',
	REFRESH_TOKEN_COOKIE_DOMAIN: 'string',

	SESSION_COOKIE_TTL: 'string',
	SESSION_COOKIE_NAME: 'string',
	SESSION_COOKIE_SECURE: 'boolean',
	SESSION_COOKIE_SAME_SITE: 'string',
	SESSION_REFRESH_GRACE_PERIOD: 'string',
	SESSION_COOKIE_DOMAIN: 'string',

	LOGIN_STALL_TIME: 'number',
	REGISTER_STALL_TIME: 'number',

	ADMIN_EMAIL: 'string',
	ADMIN_PASSWORD: 'string',
	ADMIN_TOKEN: 'string',
	KEY: 'string',
	SECRET: 'string',

	AUTH_PROVIDERS: 'string-array',
	AUTH_DISABLE_DEFAULT: 'boolean',
	AUTH_ALLOWED_PUBLIC_URLS: 'string-array',

	CORS_ENABLED: 'boolean',
	CORS_METHODS: 'string',
	CORS_ALLOWED_HEADERS: 'string-array',
	CORS_EXPOSED_HEADERS: 'string-array',
	CORS_CREDENTIALS: 'boolean',
	CORS_MAX_AGE: 'number',

	CROSS_ORIGIN_OPENER_POLICY_ENABLED: 'boolean',
	CROSS_ORIGIN_OPENER_POLICY: 'string',

	CACHE_ENABLED: 'boolean',
	CACHE_STORE: 'string',
	CACHE_TTL: 'string',
	CACHE_NAMESPACE: 'string',
	CACHE_AUTO_PURGE: 'boolean',
	CACHE_AUTO_PURGE_IGNORE_LIST: 'string-array',
	CACHE_CONTROL_S_MAXAGE: 'number',
	CACHE_SCHEMA: 'boolean',
	CACHE_SCHEMA_MAX_ITERATIONS: 'number',
	CACHE_SCHEMA_SYNC_TIMEOUT: 'number',
	CACHE_SCHEMA_FREEZE_ENABLED: 'boolean',
	CACHE_SKIP_ALLOWED: 'boolean',
	CACHE_VALUE_MAX_SIZE: 'string',
	CACHE_DEPLOYMENT_TTL: 'string',

	EXTENSIONS_PATH: 'string',
	EXTENSIONS_MUST_LOAD: 'boolean',
	EXTENSIONS_AUTO_RELOAD: 'boolean',
	EXTENSIONS_SANDBOX_MEMORY: 'number',
	EXTENSIONS_SANDBOX_TIMEOUT: 'number',
	EXTENSIONS_ROLLDOWN: 'boolean',
	EXTENSIONS_STORAGE_MAX_CONCURRENCY: 'number',
	EXTENSIONS_LOCATION: 'string',
	EXTENSIONS_LIMIT: 'number',

	MARKETPLACE_TRUST: 'string',
	MARKETPLACE_REGISTRY: 'string',

	EMAIL_FROM: 'string',
	EMAIL_VERIFY_SETUP: 'boolean',
	EMAIL_TRANSPORT: 'string',
	EMAIL_SENDMAIL_NEW_LINE: 'string',
	EMAIL_SENDMAIL_PATH: 'string',
	EMAIL_TEMPLATES_PATH: 'string',

	EMAIL_SMTP_USER: 'string',
	EMAIL_SMTP_PASSWORD: 'string',

	EMAIL_MAILTRAP_TOKEN: 'string',
	EMAIL_MAILTRAP_SANDBOX: 'boolean',
	EMAIL_MAILTRAP_TEST_INBOX_ID: 'number',
	EMAIL_MAILTRAP_BULK: 'boolean',

	TELEMETRY: 'boolean',
	TELEMETRY_URL: 'string',
	COMPLIANCE_URL: 'string',
	TELEMETRY_AUTHORIZATION: 'string',

	ASSETS_CACHE_TTL: 'string',
	ASSETS_CACHE_REVALIDATE: 'boolean',
	ASSETS_TRANSFORM_MAX_CONCURRENT: 'number',
	ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION: 'number',
	ASSETS_TRANSFORM_IMAGE_MAX_OUTPUT_DIMENSION: 'number',
	ASSETS_TRANSFORM_MAX_OPERATIONS: 'number',
	ASSETS_TRANSFORM_TIMEOUT: 'string',
	ASSETS_INVALID_IMAGE_SENSITIVITY_LEVEL: 'string',

	IMPORT_IP_DENY_LIST: 'string-array',
	IMPORT_TIMEOUT: 'string',
	IMPORT_MAX_CONCURRENCY: 'number',
	IMPORT_MAX_FILE_SIZE: 'string',
	IMPORT_EXPORT_NAMESPACE: 'string',

	FILE_METADATA_ALLOW_LIST: 'array',
	FILES_MIME_TYPE_ALLOW_LIST: 'string-array',
	FILES_DELETE_ORIGINAL_ON_MOVE: 'boolean',
	FILES_MAX_UPLOAD_CONCURRENCY: 'number',

	TUS_ENABLED: 'boolean',
	TUS_UPLOAD_EXPIRATION: 'string',
	TUS_CLEANUP_SCHEDULE: 'string',

	RELATIONAL_BATCH_SIZE: 'number',
	EXPORT_BATCH_SIZE: 'number',

	USERS_ADMIN_ACCESS_LIMIT: 'number',
	USERS_APP_ACCESS_LIMIT: 'number',
	USERS_API_ACCESS_LIMIT: 'number',
	USER_REGISTER_URL_ALLOW_LIST: 'string-array',
	USER_INVITE_URL_ALLOW_LIST: 'string-array',
	PASSWORD_RESET_URL_ALLOW_LIST: 'string-array',

	RETENTION_ENABLED: 'boolean',
	RETENTION_BATCH: 'number',
	RETENTION_SCHEDULE: 'string',
	ACTIVITY_RETENTION: 'string',
	REVISIONS_RETENTION: 'string',
	FLOW_LOGS_RETENTION: 'string',
	AUTOSAVE_REVISION_INTERVAL: 'number',

	OPENAPI_ENABLED: 'boolean',
	GRAPHQL_INTROSPECTION: 'boolean',
	GRAPHQL_SCHEMA_GENERATION_MAX_CONCURRENT: 'number',
	GRAPHQL_QUERY_TOKEN_LIMIT: 'number',
	GRAPHQL_SINGLE_USE_MUTATIONS: 'string-array',
	GRAPHQL_SCHEMA_CACHE_CAPACITY: 'number',

	WEBSOCKETS_ENABLED: 'boolean',
	WEBSOCKETS_REST_ENABLED: 'boolean',
	WEBSOCKETS_REST_AUTH: 'string',
	WEBSOCKETS_REST_AUTH_TIMEOUT: 'number',
	WEBSOCKETS_REST_PATH: 'string',
	WEBSOCKETS_GRAPHQL_ENABLED: 'boolean',
	WEBSOCKETS_GRAPHQL_AUTH: 'string',
	WEBSOCKETS_GRAPHQL_AUTH_TIMEOUT: 'number',
	WEBSOCKETS_GRAPHQL_PATH: 'string',
	WEBSOCKETS_HEARTBEAT_ENABLED: 'boolean',
	WEBSOCKETS_HEARTBEAT_PERIOD: 'number',
	WEBSOCKETS_LOGS_ENABLED: 'boolean',
	WEBSOCKETS_LOGS_PATH: 'string',
	WEBSOCKETS_LOGS_LEVEL: 'string',
	WEBSOCKETS_LOGS_STYLE: 'string',
	WEBSOCKETS_COLLAB_ENABLED: 'boolean',
	WEBSOCKETS_COLLAB_INSTANCE_TIMEOUT: 'number',
	WEBSOCKETS_COLLAB_PERMISSIONS_CACHE_CAPACITY: 'number',
	WEBSOCKETS_COLLAB_CLUSTER_CLEANUP_CRON: 'string',
	WEBSOCKETS_COLLAB_LOCAL_CLEANUP_INTERVAL: 'number',
	WEBSOCKETS_COLLAB_STORE_NAMESPACE: 'string',

	FLOWS_RUN_SCRIPT_MAX_MEMORY: 'number',
	FLOWS_RUN_SCRIPT_TIMEOUT: 'number',
	FLOWS_ENV_ALLOW_LIST: 'string-array',

	LOG_HTTP_IGNORE_PATHS: 'array',

	REDIS_ENABLED: 'boolean',
	REDIS_PASSWORD: 'string',
	REDIS_BUS_NAMESPACE: 'string',
	REDIS_LOCK_NAMESPACE: 'string',
	REDIS_COUNTERS_NAMESPACE: 'string',
	REDIS_PERMISSIONS_NAMESPACE: 'string',

	HEALTHCHECK_ENABLED: 'boolean',
	HEALTHCHECK_NAMESPACE: 'string',
	HEALTHCHECK_SERVICES: 'string-array',
	HEALTHCHECK_CACHE_TTL: 'string',

	METRICS_ENABLED: 'boolean',
	METRICS_TOKENS: 'string-array',
	METRICS_SERVICES: 'string-array',
	METRICS_SCHEDULE: 'string',
	METRICS_NAME_PREFIX: 'string',
	METRICS_HEALTH_CHECK_PREFIX: 'string',

	PROJECT_OWNER_ENABLED: 'boolean',

	MCP_ENABLED: 'boolean',
	MCP_OAUTH_ENABLED: 'boolean',
	MCP_OAUTH_AUTH_CODE_TTL: 'string',
	MCP_OAUTH_MAX_CLIENTS: 'number',
	MCP_OAUTH_CLIENT_UNUSED_TTL: 'string',
	MCP_OAUTH_CLIENT_IDLE_TTL: 'string',
	MCP_OAUTH_REQUIRE_RESOURCE: 'boolean',
	MCP_OAUTH_CLEANUP_SCHEDULE: 'string',
	MCP_OAUTH_ALLOWED_REDIRECT_DOMAINS: 'string-array',
	MCP_OAUTH_ALLOWED_CUSTOM_REDIRECTS: 'string-array',
	MCP_OAUTH_DCR_ENABLED: 'boolean',
	MCP_OAUTH_CIMD_ENABLED: 'boolean',
	MCP_OAUTH_CIMD_ALLOW_HTTP: 'boolean',
	MCP_OAUTH_CIMD_ALLOWED_DOMAINS: 'string-array',
	MCP_OAUTH_CIMD_BLOCKED_TLDS: 'array',

	AI_ENABLED: 'boolean',
	AI_DEVTOOLS_ENABLED: 'boolean',
	AI_TELEMETRY_ENABLED: 'boolean',
	AI_TELEMETRY_PROVIDER: 'string',
	AI_TELEMETRY_RECORD_IO: 'boolean',
	LANGFUSE_SECRET_KEY: 'string',
	LANGFUSE_PUBLIC_KEY: 'string',
	LANGFUSE_BASE_URL: 'string',
	BRAINTRUST_API_KEY: 'string',
	BRAINTRUST_PROJECT_NAME: 'string',
	BRAINTRUST_API_URL: 'string',

	LICENSE_NAMESPACE: 'string',
	LICENSE_KEY_MANAGEMENT_ENABLED: 'boolean',
	LICENSE_KEY: 'string',
	LICENSE_TOKEN: 'string',

	'STORAGE_.+_SECRET': 'string',

	'AUTH_.+_BIND_DN': 'string',
	'AUTH_.+_USER_DN': 'string',
	'AUTH_.+_GROUP_DN': 'string',
	'AUTH_.+_BIND_PASSWORD': 'string',
	'AUTH_.+_COOKIE_SECURE': 'boolean',
} as const;

export const TYPE_MAP_REGEX: [RegExp, EnvType][] = Object.entries(TYPE_MAP).map(([name, value]) => [
	new RegExp(`^${name}$`),
	value,
]);
