import { TransformationParams } from './types';
import env from './env';
import ms from 'ms';

export const SYSTEM_ASSET_ALLOW_LIST: TransformationParams[] = [
	{
		key: 'system-small-cover',
		transforms: [['resize', { width: 64, height: 64, fit: 'cover' }]],
	},
	{
		key: 'system-small-contain',
		transforms: [['resize', { width: 64, fit: 'contain' }]],
	},
	{
		key: 'system-medium-cover',
		transforms: [['resize', { width: 300, height: 300, fit: 'cover' }]],
	},
	{
		key: 'system-medium-contain',
		transforms: [['resize', { width: 300, fit: 'contain' }]],
	},
	{
		key: 'system-large-cover',
		transforms: [['resize', { width: 800, height: 800, fit: 'cover' }]],
	},
	{
		key: 'system-large-contain',
		transforms: [['resize', { width: 800, fit: 'contain' }]],
	},
];

export const ASSET_TRANSFORM_QUERY_KEYS = [
	'key',
	'transforms',
	'width',
	'height',
	'format',
	'fit',
	'quality',
	'withoutEnlargement',
];

export const FILTER_VARIABLES = ['$NOW', '$CURRENT_USER', '$CURRENT_ROLE'];

export const ALIAS_TYPES = ['alias', 'o2m', 'm2m', 'm2a', 'o2a', 'files', 'translations'];

export const DEFAULT_AUTH_PROVIDER = 'default';

export const COLUMN_TRANSFORMS = ['year', 'month', 'day', 'weekday', 'hour', 'minute', 'second'];

export const UUID_REGEX = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

export const COOKIE_OPTIONS = {
	httpOnly: true,
	domain: env.REFRESH_TOKEN_COOKIE_DOMAIN,
	maxAge: ms(env.REFRESH_TOKEN_TTL as string),
	secure: env.REFRESH_TOKEN_COOKIE_SECURE ?? false,
	sameSite: (env.REFRESH_TOKEN_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'strict',
};

export const ALLOWED_ENVIRONMENT_VARIABLES = [
	// general
	'CONFIG_PATH',
	'HOST',
	'PORT',
	'PUBLIC_URL',
	'LOG_LEVEL',
	'LOG_STYLE',
	'MAX_PAYLOAD_SIZE',
	'ROOT_REDIRECT',
	'SERVE_APP',
	'GRAPHQL_INTROSPECTION',
	// server
	'SERVER_KEEP_ALIVE_TIMEOUT',
	'SERVER_HEADERS_TIMEOUT',
	// database
	'DB_CLIENT',
	'DB_HOST',
	'DB_PORT',
	'DB_DATABASE',
	'DB_USER',
	'DB_PASSWORD',
	'DB_FILENAME',
	'DB_CONNECTION_STRING',
	'DB_POOL_.+',
	'DB_EXCLUDE_TABLES',
	'DB_CHARSET',
	'DB_VERSION',
	// security
	'KEY',
	'SECRET',
	'ACCESS_TOKEN_TTL',
	'REFRESH_TOKEN_TTL',
	'REFRESH_TOKEN_COOKIE_DOMAIN',
	'REFRESH_TOKEN_COOKIE_SECURE',
	'REFRESH_TOKEN_COOKIE_SAME_SITE',
	'REFRESH_TOKEN_COOKIE_NAME',
	'PASSWORD_RESET_URL_ALLOW_LIST',
	'USER_INVITE_URL_ALLOW_LIST',
	'IP_TRUST_PROXY',
	'IP_CUSTOM_HEADER',
	'ASSETS_CONTENT_SECURITY_POLICY',
	'IMPORT_IP_DENY_LIST',
	'CONTENT_SECURITY_POLICY_.+',
	'HSTS_.+', // covers 'HSTS_ENABLED' too
	// hashing
	'HASH_MEMORY_COST',
	'HASH_LENGTH',
	'HASH_TIME_COST',
	'HASH_PARALLELISM',
	'HASH_TYPE',
	'HASH_ASSOCIATED_DATA',
	// cors
	'CORS_ENABLED',
	'CORS_ORIGIN',
	'CORS_METHODS',
	'CORS_ALLOWED_HEADERS',
	'CORS_EXPOSED_HEADERS',
	'CORS_CREDENTIALS',
	'CORS_MAX_AGE',
	// rate limiting
	'RATE_LIMITER_ENABLED',
	'RATE_LIMITER_POINTS',
	'RATE_LIMITER_DURATION',
	'RATE_LIMITER_STORE',
	'RATE_LIMITER_REDIS',
	'RATE_LIMITER_REDIS_HOST',
	'RATE_LIMITER_REDIS_PORT',
	'RATE_LIMITER_REDIS_PASSWORD',
	'RATE_LIMITER_MEMCACHE',
	// cache
	'CACHE_ENABLED',
	'CACHE_TTL',
	'CACHE_CONTROL_S_MAXAGE',
	'CACHE_AUTO_PURGE',
	'CACHE_SYSTEM_TTL',
	'CACHE_SCHEMA',
	'CACHE_PERMISSIONS',
	'CACHE_NAMESPACE',
	'CACHE_STORE',
	'CACHE_STATUS_HEADER',
	'CACHE_REDIS',
	'CACHE_REDIS_HOST',
	'CACHE_REDIS_PORT',
	'CACHE_REDIS_PASSWORD',
	'CACHE_MEMCACHE',
	// storage
	'STORAGE_LOCATIONS',
	'STORAGE_.+_DRIVER',
	'STORAGE_.+_ROOT',
	'STORAGE_.+_KEY',
	'STORAGE_.+_SECRET',
	'STORAGE_.+_BUCKET',
	'STORAGE_.+_REGION',
	'STORAGE_.+_ENDPOINT',
	'STORAGE_.+_ACL',
	'STORAGE_.+_CONTAINER_NAME',
	'STORAGE_.+_ACCOUNT_NAME',
	'STORAGE_.+_ACCOUNT_KEY',
	'STORAGE_.+_ENDPOINT',
	'STORAGE_.+_KEY_FILENAME',
	'STORAGE_.+_BUCKET',
	// metadata
	'FILE_METADATA_ALLOW_LIST',
	// assets
	'ASSETS_CACHE_TTL',
	'ASSETS_TRANSFORM_MAX_CONCURRENT',
	'ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION',
	'ASSETS_TRANSFORM_MAX_OPERATIONS',
	'ASSETS_CONTENT_SECURITY_POLICY',
	// auth
	'AUTH_PROVIDERS',
	'AUTH_DISABLE_DEFAULT',
	'AUTH_.+_DRIVER',
	'AUTH_.+_CLIENT_ID',
	'AUTH_.+_CLIENT_SECRET',
	'AUTH_.+_SCOPE',
	'AUTH_.+_AUTHORIZE_URL',
	'AUTH_.+_ACCESS_URL',
	'AUTH_.+_PROFILE_URL',
	'AUTH_.+_IDENTIFIER_KEY',
	'AUTH_.+_EMAIL_KEY',
	'AUTH_.+_FIRST_NAME_KEY',
	'AUTH_.+_LAST_NAME_KEY',
	'AUTH_.+_ALLOW_PUBLIC_REGISTRATION',
	'AUTH_.+_DEFAULT_ROLE_ID',
	'AUTH_.+_ICON',
	'AUTH_.+_PARAMS',
	'AUTH_.+_ISSUER_URL',
	'AUTH_.+_AUTH_REQUIRE_VERIFIED_EMAIL',
	'AUTH_.+_CLIENT_URL',
	'AUTH_.+_BIND_DN',
	'AUTH_.+_BIND_PASSWORD',
	'AUTH_.+_USER_DN',
	'AUTH_.+_USER_ATTRIBUTE',
	'AUTH_.+_USER_SCOPE',
	'AUTH_.+_MAIL_ATTRIBUTE',
	'AUTH_.+_FIRST_NAME_ATTRIBUTE',
	'AUTH_.+_LAST_NAME_ATTRIBUTE',
	'AUTH_.+_GROUP_DN',
	'AUTH_.+_GROUP_ATTRIBUTE',
	'AUTH_.+_GROUP_SCOPE',
	// extensions
	'EXTENSIONS_PATH',
	'EXTENSIONS_AUTO_RELOAD',
	// emails
	'EMAIL_FROM',
	'EMAIL_TRANSPORT',
	'EMAIL_SENDMAIL_NEW_LINE',
	'EMAIL_SENDMAIL_PATH',
	'EMAIL_SMTP_HOST',
	'EMAIL_SMTP_PORT',
	'EMAIL_SMTP_USER',
	'EMAIL_SMTP_PASSWORD',
	'EMAIL_SMTP_POOL',
	'EMAIL_SMTP_SECURE',
	'EMAIL_SMTP_IGNORE_TLS',
	'EMAIL_MAILGUN_API_KEY',
	'EMAIL_MAILGUN_DOMAIN',
	'EMAIL_MAILGUN_HOST',
	'EMAIL_SES_CREDENTIALS__ACCESS_KEY_ID',
	'EMAIL_SES_CREDENTIALS__SECRET_ACCESS_KEY',
	'EMAIL_SES_REGION',
	// admin account
	'ADMIN_EMAIL',
	'ADMIN_PASSWORD',
	// telemetry
	'TELEMETRY',
	// limits & optimization
	'RELATIONAL_BATCH_SIZE',
	'EXPORT_BATCH_SIZE',
];
