import type { EnvType } from '../types/env-type.js';

export const guessType = (value: unknown): EnvType => {
	if (value === 'true' || value === 'false') {
		return 'boolean';
	}

	if (
		String(value).startsWith('0') === false &&
		isNaN(Number(value)) === false &&
		Number(value) <= Number.MAX_SAFE_INTEGER
	) {
		return 'number';
	}

	if (String(value).includes(',')) {
		return 'array';
	}

	return 'json';
};
