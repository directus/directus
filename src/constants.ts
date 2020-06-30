import { Transformation } from './types/assets';
import { Collection } from './types/collection';

export const SYSTEM_ASSET_WHITELIST: Transformation[] = [
	{
		key: 'directus-small-cover',
		w: 64,
		h: 64,
		f: 'cover',
	},
	{
		key: 'directus-small-contain',
		w: 64,
		f: 'contain',
	},
	{
		key: 'directus-medium-cover',
		w: 300,
		h: 300,
		f: 'cover',
	},
	{
		key: 'directus-medium-contain',
		w: 300,
		f: 'contain',
	},
	{
		key: 'directus-large-cover',
		w: 800,
		h: 600,
		f: 'cover',
	},
	{
		key: 'directus-large-contain',
		w: 800,
		f: 'contain',
	},
];

export const ASSET_GENERATION_QUERY_KEYS = ['key', 'w', 'h', 'f'];
