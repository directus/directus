import type { Knex } from 'knex';
import { NumberDatabaseHelper } from '../types.js';
import type { NumericValue } from '@directus/types';
import { maybeStringifyBigInt } from '../utils/maybe-stringify-big-int.js';

export class NumberHelperSQLite extends NumberDatabaseHelper {
	override addSearchCondition(
		dbQuery: Knex.QueryBuilder,
		collection: string,
		name: string,
		value: NumericValue,
	): Knex.QueryBuilder {
		return dbQuery.orWhere({ [`${collection}.${name}`]: maybeStringifyBigInt(value) });
	}
}
