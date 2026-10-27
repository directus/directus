import type { NumericValue } from '@directus/types';
import type { NumberInfo } from '@directus/utils';
import type { Knex } from 'knex';
import { DatabaseHelper } from '../types.js';

export abstract class NumberDatabaseHelper extends DatabaseHelper {
	addSearchCondition(
		dbQuery: Knex.QueryBuilder,
		collection: string,
		name: string,
		value: NumericValue,
		logical: 'and' | 'or',
	): Knex.QueryBuilder {
		return dbQuery[logical].where({ [`${collection}.${name}`]: value });
	}

	isNumberValid(_value: NumericValue, _info: NumberInfo) {
		return true;
	}
}
