import { NumberDatabaseHelper, type NumberInfo } from '../types.js';
import { maybeStringifyBigInt } from '../utils/maybe-stringify-big-int.js';
import { numberInRange } from '../utils/number-in-range.js';
import type { NumericValue } from '@directus/types';
import type { Knex } from 'knex';

export class NumberHelperMSSQL extends NumberDatabaseHelper {
	override addSearchCondition(
		dbQuery: Knex.QueryBuilder,
		collection: string,
		name: string,
		value: NumericValue,
		logical: 'and' | 'or',
	): Knex.QueryBuilder {
		return dbQuery[logical].where({ [`${collection}.${name}`]: maybeStringifyBigInt(value) });
	}

	override isNumberValid(value: NumericValue, info: NumberInfo) {
		return numberInRange(value, info);
	}
}
