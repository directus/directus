import type { Knex } from 'knex';
import { DatabaseHelper } from '../types.js';

export class NumberSearchHelper extends DatabaseHelper {
	orWhere(dbQuery: Knex.QueryBuilder, collection: string, name: string, value: number | bigint): Knex.QueryBuilder {
		return dbQuery.orWhere({ [`${collection}.${name}`]: value });
	}

	numberInRange(_type: string, _value: number | bigint) {
		// Only MS SQL currently relies on value limit checking
		return true;
	}
}
