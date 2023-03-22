import type { CookieOptions } from 'express';
import env from './env';
import type { TransformationParams } from './types';
import { getMilliseconds } from './utils/get-milliseconds';

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

export const GENERATE_SPECIAL = ['uuid', 'date-created', 'role-created', 'user-created'];

export const UUID_REGEX = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

export const COOKIE_OPTIONS: CookieOptions = {
	httpOnly: true,
	domain: env.REFRESH_TOKEN_COOKIE_DOMAIN,
	maxAge: getMilliseconds(env.REFRESH_TOKEN_TTL),
	secure: env.REFRESH_TOKEN_COOKIE_SECURE ?? false,
	sameSite: (env.REFRESH_TOKEN_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'strict',
};

export const OAS_REQUIRED_SCHEMAS = ['Diff', 'Schema', 'Query', 'x-metadata'];
