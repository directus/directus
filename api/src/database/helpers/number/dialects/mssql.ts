import type { Knex } from 'knex';
import { numberInRange } from '../utils/number-in-range.js';
import { NumberDatabaseHelper, type NumberInfo } from '../types.js';
import type { NumericValue } from '@directus/types';

export class NumberHelperMSSQL extends NumberDatabaseHelper {
	override addSearchCondition(
		dbQuery: Knex.QueryBuilder,
		collection: string,
		name: string,
		value: NumericValue,
	): Knex.QueryBuilder {
		// MS SQL requires big int sized numbers to be formatted as string
		if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
			return dbQuery.orWhere({ [`${collection}.${name}`]: String(value) });
		}

		return dbQuery.orWhere({ [`${collection}.${name}`]: Number(value) });
	}

	override isNumberValid(value: NumericValue, info: NumberInfo) {
		return numberInRange(value, info);
	}
}
