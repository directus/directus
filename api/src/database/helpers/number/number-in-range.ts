import type { Type } from '@directus/types';
import { DEFAULT_NUMERIC_PRECISION, DEFAULT_NUMERIC_SCALE } from '../../../constants.js';

const MAX_BIGINT = 2n ** 63n - 1n;
const MIN_BIGINT = (-2n) ** 63n;

const MAX_INT = 2 ** 31 - 1;
const MIN_INT = (-2) ** 31;

export function numberInRange(
	value: number | bigint,
	info: { type: Type; precision: number | null; scale: number | null },
) {
	switch (info.type) {
		case 'bigInteger':
			return value >= MIN_BIGINT && value <= MAX_BIGINT;

		case 'decimal': {
			const { min, max } = decimalLimits(info.precision, info.scale);
			return value >= min && value <= max;
		}

		case 'integer':
			return value >= MIN_INT && value <= MAX_INT;
		case 'float':
			return true; // Not sure how to calculate the float limits
		default:
			return false;
	}
}

function decimalLimits(precision: number | null, scale: number | null) {
	precision = precision ?? DEFAULT_NUMERIC_PRECISION;
	scale = scale ?? DEFAULT_NUMERIC_SCALE;

	const max = 10 ** (precision - scale) - 10 ** -scale;
	const min = -(10 ** (precision - scale)) + 10 ** -scale;

	return { max, min };
}
