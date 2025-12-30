import type { NumberInfo } from '../types.js';
import { calculateDecimalLimit } from './decimal-limit.js';
import { MAX_SAFE_INT32, MAX_SAFE_INT64, MIN_SAFE_INT32, MIN_SAFE_INT64 } from '@directus/constants';
import type { NumericValue } from '@directus/types';

export function numberInRange(value: NumericValue, info: NumberInfo) {
	switch (info.type) {
		case 'bigInteger':
			return value >= MIN_SAFE_INT64 && value <= MAX_SAFE_INT64;

		case 'decimal': {
			const { min, max } = calculateDecimalLimit(info.precision, info.scale);
			return value >= min && value <= max;
		}

		case 'integer':
			return value >= MIN_SAFE_INT32 && value <= MAX_SAFE_INT32;

		case 'float':
			// Not sure how to calculate the logical limits of float
			// Let the database decide and error;
			return true;

		default:
			return false;
	}
}
