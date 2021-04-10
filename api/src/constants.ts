import { Transformation } from './types/assets';

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
