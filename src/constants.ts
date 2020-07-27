import { Transformation } from './types/assets';

export const SYSTEM_ASSET_ALLOW_LIST: Transformation[] = [
	{
		key: 'system-small-cover',
		w: 64,
		h: 64,
		f: 'cover',
	},
	{
		key: 'system-small-contain',
		w: 64,
		f: 'contain',
	},
	{
		key: 'system-medium-cover',
		w: 300,
		h: 300,
		f: 'cover',
	},
	{
		key: 'system-medium-contain',
		w: 300,
		f: 'contain',
	},
	{
		key: 'system-large-cover',
		w: 800,
		h: 600,
		f: 'cover',
	},
	{
		key: 'system-large-contain',
		w: 800,
		f: 'contain',
	},
];

export const ASSET_TRANSFORM_QUERY_KEYS = ['key', 'w', 'h', 'f'];
