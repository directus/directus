import type { Type } from '@directus/types';
import type { Knex } from 'knex';
import { numberInRange } from '../number-in-range.js';
import { NumberWhereHelpers } from '../types.js';

export class NumberWhereHelperMSSQL extends NumberWhereHelpers {
	override orWhere(
		dbQuery: Knex.QueryBuilder,
		collection: string,
		name: string,
		value: number | bigint,
	): Knex.QueryBuilder {
		// MS SQL requires big int sized numbers to be formatted as string
		if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
			return dbQuery.orWhere({ [`${collection}.${name}`]: String(value) });
		}

		return dbQuery.orWhere({ [`${collection}.${name}`]: Number(value) });
	}

	override numberValid(value: number | bigint, info: { type: Type; precision: number | null; scale: number | null }) {
		return numberInRange(value, info);
	}
}
