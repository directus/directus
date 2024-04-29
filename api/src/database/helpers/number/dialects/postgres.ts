import { NumberDatabaseHelper, type NumberInfo, type NumericValue } from '../types.js';
import { numberInRange } from '../utils/number-in-range.js';

export class NumberHelperPostgres extends NumberDatabaseHelper {
	override isNumberValid(value: NumericValue, info: NumberInfo): boolean {
		// Check that number is within the range of the type and ensure that only integer values are passed for integer types
		return (
			numberInRange(value, info) &&
			(info.type === 'float' || info.type === 'decimal' || typeof value === 'bigint' || value % 1 === 0)
		);
	}
}
