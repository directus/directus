import type { UnknownObject } from '@directus/types';

export function isObject(input: unknown): input is UnknownObject {
	return typeof input === 'object' && input !== null && !Array.isArray(input);
}
