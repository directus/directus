import { ApiExtensionType, AppExtensionType, ExtensionType, Transformation } from './types';

export const SYSTEM_ASSET_ALLOW_LIST: Transformation[] = [
	{
		key: 'system-small-cover',
		width: 64,
		height: 64,
		fit: 'cover',
	},
	{
		key: 'system-small-contain',
		width: 64,
		fit: 'contain',
	},
	{
		key: 'system-medium-cover',
		width: 300,
		height: 300,
		fit: 'cover',
	},
	{
		key: 'system-medium-contain',
		width: 300,
		fit: 'contain',
	},
	{
		key: 'system-large-cover',
		width: 800,
		height: 600,
		fit: 'cover',
	},
	{
		key: 'system-large-contain',
		width: 800,
		fit: 'contain',
	},
];

export const ASSET_TRANSFORM_QUERY_KEYS = ['key', 'width', 'height', 'fit', 'withoutEnlargement', 'quality'];

export const FILTER_VARIABLES = ['$NOW', '$CURRENT_USER', '$CURRENT_ROLE'];

export const ALIAS_TYPES = ['alias', 'o2m', 'm2m', 'm2a', 'files', 'files', 'translations'];

export const APP_EXTENSION_TYPES: AppExtensionType[] = ['interface', 'display', 'layout', 'module'];
export const API_EXTENSION_TYPES: ApiExtensionType[] = ['endpoint', 'hook'];
export const EXTENSION_TYPES: ExtensionType[] = [...APP_EXTENSION_TYPES, ...API_EXTENSION_TYPES];

export const SHARED_DEPS = ['vue'];

export const EXTENSION_NAME_REGEX = /^(?:(?:@[^/]+\/)?directus-extension-|@directus\/extension-).+$/;
