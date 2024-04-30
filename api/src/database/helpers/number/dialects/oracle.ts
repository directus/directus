import type { Knex } from 'knex';
import { NumberDatabaseHelper } from '../types.js';
import type { NumericValue } from '@directus/types';

export class NumberHelperOracle extends NumberDatabaseHelper {
	override addSearchCondition(
		dbQuery: Knex.QueryBuilder,
		collection: string,
		name: string,
		value: NumericValue,
	): Knex.QueryBuilder {
		// Oracle requires big int sized numbers to be formatted as string
		if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
			return dbQuery.orWhere({ [`${collection}.${name}`]: String(value) });
		}

		return dbQuery.orWhere({ [`${collection}.${name}`]: Number(value) });
	}
}
