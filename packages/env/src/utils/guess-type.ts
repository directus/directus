import { ENV_TYPES } from '../constants/env-types.js';

export const guessType = (value: unknown): (typeof ENV_TYPES)[number] => {
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
