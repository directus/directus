import type { Type } from '@directus/types';
import { NumberWhereHelpers } from '../types.js';
import { numberInRange } from '../number-in-range.js';

export class NumberWhereHelperPostgres extends NumberWhereHelpers {
	override numberValid(
		value: number | bigint,
		info: { type: Type; precision: number | null; scale: number | null },
	): boolean {
		// Check that number is within the range of the type and ensure that only integer values are passed for integer types
		return (
			numberInRange(value, info) &&
			(info.type === 'float' || info.type === 'decimal' || typeof value === 'bigint' || value % 1 === 0)
		);
	}
}
