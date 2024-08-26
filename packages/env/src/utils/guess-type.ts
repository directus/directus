import type { EnvType } from '../types/env-type.js';

export const guessType = (value: unknown): EnvType => {
	if (typeof value === 'boolean' || value === 'true' || value === 'false') {
		return 'boolean';
	}

	if (
		typeof value === 'number' ||
		(!String(value).startsWith('0') &&
			!isNaN(Number(value)) &&
			String(value).length > 0 &&
			Number(value) >= Number.MIN_SAFE_INTEGER &&
			Number(value) <= Number.MAX_SAFE_INTEGER)
	) {
		return 'number';
	}

	if (Array.isArray(value) || String(value).includes(',')) {
		return 'array';
	}

	return 'json';
};
