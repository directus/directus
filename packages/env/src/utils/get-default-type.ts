import { TYPE_MAP_REGEX } from '../constants/type-map.js';
import type { EnvType } from '../types/env-type.js';

export const getDefaultType = (key: string | undefined): EnvType | null => {
	if (!key) return null;

	const type = TYPE_MAP_REGEX.find(([map_key, _]) => map_key.test(key));

	if (type !== undefined) {
		return type[1];
	}

	return null;
};
