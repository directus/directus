import type { Knex } from 'knex';
import { NumberSearchHelper } from '../types.js';

const MAX_BIGINT = 2n ** 63n - 1n;
const MIN_BIGINT = (-2n) ** 63n;

const MAX_INT = 2 ** 31 - 1;
const MIN_INT = (-2) ** 31;

const MAX_DECIMAL = 10 ** (10 - 6) - 10 ** -6;
const MIN_DECIMAL = -(10 ** (10 - 6)) + 10 ** -6;

export class NumberSearchHelperMSSQL extends NumberSearchHelper {
	override orWhere(
		dbQuery: Knex.QueryBuilder,
		collection: string,
		name: string,
		value: number | bigint,
	): Knex.QueryBuilder {
		// MS SQL requires big int sized numbers to be formatted as string
		if (value > Number.MAX_SAFE_INTEGER) {
			return dbQuery.orWhere({ [`${collection}.${name}`]: String(value) });
		}

		return dbQuery.orWhere({ [`${collection}.${name}`]: Number(value) });
	}

	override numberInRange(type: string, value: number | bigint) {
		switch (type) {
			case 'bigInteger':
				return value >= MIN_BIGINT && value <= MAX_BIGINT;
			case 'decimal':
				return value >= MIN_DECIMAL && value <= MAX_DECIMAL;
			case 'integer':
				return value >= MIN_INT && value <= MAX_INT;
			case 'float':
				return true; // Not sure how to calculate the float limits
			default:
				return false;
		}
	}
}
