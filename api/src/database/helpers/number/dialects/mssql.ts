import type { Knex } from 'knex';
import { NumberSearchHelper } from '../types.js';

export class NumberSearchHelperMSSQL extends NumberSearchHelper {
	override orWhere(dbQuery: Knex.QueryBuilder, collection: string, name: string, value: number, type: string): Knex.QueryBuilder {
		if (value > Number.MAX_SAFE_INTEGER) {
			if (type === 'integer') {
				return dbQuery; // cant match bigger number than int
			}

			return dbQuery.orWhere({ [`${collection}.${name}`]: String(value) });
		}

		return dbQuery.orWhere({ [`${collection}.${name}`]: value });
	}
}
