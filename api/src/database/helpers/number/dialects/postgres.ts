import type { NumericValue } from '@directus/types';
import { NumberDatabaseHelper, type NumberInfo } from '../types.js';
import { numberInRange } from '../utils/number-in-range.js';

export class NumberHelperPostgres extends NumberDatabaseHelper {
	override isNumberValid(value: NumericValue, info: NumberInfo): boolean {
		// Check that number is within the range of the provided type
		if (numberInRange(value, info)) {
			// Ensure that only integer values are used for integer types
			if (typeof value !== 'bigint' && ['integer', 'bigInteger'].includes(info.type)) {
				return value % 1 === 0;
			}

			return true;
		}

		return false;
	}
}
