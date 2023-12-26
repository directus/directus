import { TYPE_MAP } from '../constants/type-map.js';
import type { EnvType } from '../types/env-type.js';

export const getTypeFromMap = (key: string): EnvType | null => {
	if (key in TYPE_MAP) {
		return TYPE_MAP[key]!;
	}

	return null;
};
