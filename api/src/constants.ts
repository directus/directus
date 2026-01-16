import { useEnv } from '@directus/env';
import type { RawField, TransformationParams } from '@directus/types';
import { toBoolean } from '@directus/utils';
import bytes from 'bytes';
import type { CookieOptions } from 'express';
import { getMilliseconds } from './utils/get-milliseconds.js';

const env = useEnv();

export const SYSTEM_ASSET_ALLOW_LIST: TransformationParams[] = [
	{
		key: 'system-small-cover',
		format: 'auto',
		transforms: [['resize', { width: 64, height: 64, fit: 'cover' }]],
	},
	{
		key: 'system-small-contain',
		format: 'auto',
		transforms: [['resize', { width: 64, fit: 'contain' }]],
	},
	{
		key: 'system-medium-cover',
		format: 'auto',
		transforms: [['resize', { width: 300, height: 300, fit: 'cover' }]],
	},
	{
		key: 'system-medium-contain',
		format: 'auto',
		transforms: [['resize', { width: 300, fit: 'contain' }]],
	},
	{
		key: 'system-large-cover',
		format: 'auto',
		transforms: [['resize', { width: 800, height: 800, fit: 'cover' }]],
	},
	{
		key: 'system-large-contain',
		format: 'auto',
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
	'focal_point_x',
	'focal_point_y',
] as const satisfies Readonly<(keyof TransformationParams)[]>;

export const FILTER_VARIABLES = ['$NOW', '$CURRENT_USER', '$CURRENT_ROLE'];

export const ALIAS_TYPES = ['alias', 'o2m', 'm2m', 'm2a', 'o2a', 'files', 'translations'];

export const DEFAULT_AUTH_PROVIDER = 'default';

export const COLUMN_TRANSFORMS = ['year', 'month', 'day', 'weekday', 'hour', 'minute', 'second'];

export const GENERATE_SPECIAL = [
	'uuid',
	'date-created',
	'date-updated',
	'role-created',
	'role-updated',
	'user-created',
	'user-updated',
] as const;

export const UUID_REGEX = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
	httpOnly: true,
	domain: env['REFRESH_TOKEN_COOKIE_DOMAIN'] as string,
	maxAge: getMilliseconds(env['REFRESH_TOKEN_TTL'] as string),
	secure: Boolean(env['REFRESH_TOKEN_COOKIE_SECURE']),
	sameSite: (env['REFRESH_TOKEN_COOKIE_SAME_SITE'] || 'strict') as 'lax' | 'strict' | 'none',
};

export const SESSION_COOKIE_OPTIONS: CookieOptions = {
	httpOnly: true,
	domain: env['SESSION_COOKIE_DOMAIN'] as string,
	maxAge: getMilliseconds(env['SESSION_COOKIE_TTL'] as string),
	secure: Boolean(env['SESSION_COOKIE_SECURE']),
	sameSite: (env['SESSION_COOKIE_SAME_SITE'] || 'strict') as 'lax' | 'strict' | 'none',
};

export const OAS_REQUIRED_SCHEMAS = ['Query', 'x-metadata'];

/** Formats from which transformation is supported */
export const SUPPORTED_IMAGE_TRANSFORM_FORMATS = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'image/avif'];

/** Formats where metadata extraction is supported */
export const SUPPORTED_IMAGE_METADATA_FORMATS = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/tiff',
	'image/avif',
];

/** File uploads */
export const FILE_UPLOADS = {
	MAX_SIZE: bytes.parse(env['FILES_MAX_UPLOAD_SIZE'] as string),
	MAX_CONCURRENCY: Number(env['FILES_MAX_UPLOAD_CONCURRENCY']),
};

/** Resumable uploads (TUS) */
export const RESUMABLE_UPLOADS = {
	ENABLED: toBoolean(env['TUS_ENABLED']),
	CHUNK_SIZE: bytes.parse(env['TUS_CHUNK_SIZE'] as string),
	EXPIRATION_TIME: getMilliseconds(env['TUS_UPLOAD_EXPIRATION'], 600_000 /* 10min */),
	SCHEDULE: String(env['TUS_CLEANUP_SCHEDULE'] as string),
};

export const ALLOWED_DB_DEFAULT_FUNCTIONS = ['gen_random_uuid()'];

export const INJECTED_PRIMARY_KEY_FIELD: RawField = {
	field: 'id',
	type: 'integer',
	meta: {
		hidden: true,
		interface: 'numeric',
		readonly: true,
	},
	schema: {
		is_primary_key: true,
		has_auto_increment: true,
	},
};
