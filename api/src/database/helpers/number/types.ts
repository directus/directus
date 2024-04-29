import type { Knex } from 'knex';
import { DatabaseHelper } from '../types.js';

// move to @directus/types
const NUMERIC_TYPES = ['bigInteger', 'decimal', 'float', 'integer'] as const;

export type NumericValue = number | bigint;
export type NumericType = (typeof NUMERIC_TYPES)[number];
export type NumberInfo = {
	type: NumericType;
	precision: number | null;
	scale: number | null;
};

export abstract class NumberDatabaseHelper extends DatabaseHelper {
	// maybe call this "addSearchCondition"?
	orWhere(dbQuery: Knex.QueryBuilder, collection: string, name: string, value: NumericValue): Knex.QueryBuilder {
		return dbQuery.orWhere({ [`${collection}.${name}`]: value });
	}

	isNumberValid(_value: NumericValue, _info: NumberInfo) {
		return true;
	}
}
