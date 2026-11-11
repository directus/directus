import { TYPE_MAP_REGEX } from '../constants/type-map.js';
import type { EnvType, TypeMapEntry } from '../types/env-type.js';

/**
 * Returns the type a variable is cast to. For variables with multiple allowed types, that's the first one
 */
export function getDefaultType(key: string | undefined): EnvType | null {
	const entry = getTypeMapEntry(key);

	if (entry === null) return null;

	return typeof entry === 'string' ? entry : entry[0];
}

/**
 * Returns the type map entry for the given key, which is either a single type or a list of allowed types
 */
export function getTypeMapEntry(key: string | undefined): TypeMapEntry | null {
	if (!key) return null;

	return TYPE_MAP_REGEX.find(([mapKey]) => mapKey.test(key))?.[1] ?? null;
}
