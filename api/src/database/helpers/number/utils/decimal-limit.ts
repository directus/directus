import { DEFAULT_NUMERIC_PRECISION, DEFAULT_NUMERIC_SCALE } from '../../../../constants.js';

export function calculateDecimalLimit(precision: number | null, scale: number | null) {
	if (precision === null || scale === null) {
		precision = DEFAULT_NUMERIC_PRECISION;
		scale = DEFAULT_NUMERIC_SCALE;
	}

	const max = 10 ** (precision - scale) - 10 ** -scale;
	const min = -(10 ** (precision - scale)) + 10 ** -scale;

	return { max, min };
}
