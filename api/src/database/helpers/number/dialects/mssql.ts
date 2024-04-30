import type { Knex } from 'knex';
import { maybeStringifyBigInt } from '../utils/maybe-stringify-big-int.js';
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
		return dbQuery.orWhere({ [`${collection}.${name}`]: maybeStringifyBigInt(value) });
	}

	override isNumberValid(value: NumericValue, info: NumberInfo) {
		return numberInRange(value, info);
	}
}
