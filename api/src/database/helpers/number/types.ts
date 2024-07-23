import type { Knex } from 'knex';
import { DatabaseHelper } from '../types.js';
import type { NumericType, NumericValue } from '@directus/types';

export type NumberInfo = {
	type: NumericType;
	precision: number | null;
	scale: number | null;
};

export abstract class NumberDatabaseHelper extends DatabaseHelper {
	addSearchCondition(
		dbQuery: Knex.QueryBuilder,
		collection: string,
		name: string,
		value: NumericValue,
	): Knex.QueryBuilder {
		return dbQuery.orWhere({ [`${collection}.${name}`]: value });
	}

	isNumberValid(_value: NumericValue, _info: NumberInfo) {
		return true;
	}
}
