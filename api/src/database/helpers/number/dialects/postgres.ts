import type { NumericValue } from '@directus/types';
import { NumberDatabaseHelper, type NumberInfo } from '../types.js';
import { numberInRange } from '../utils/number-in-range.js';

export class NumberHelperPostgres extends NumberDatabaseHelper {
	override isNumberValid(value: NumericValue, info: NumberInfo): boolean {
		// Check that number is within the range of the type and ensure that only integer values are used for integer types
		// We assume that if the value is a bigint already it lost all of its decimal places anyway, so it's safe to use
		return (
			numberInRange(value, info) &&
			(info.type === 'float' || info.type === 'decimal' || typeof value === 'bigint' || value % 1 === 0)
		);
	}
}
