import type { Knex } from 'knex';
import { NumberSearchHelper } from '../types.js';

export class NumberSearchHelperPostgres extends NumberSearchHelper {
	override orWhere(dbQuery: Knex.QueryBuilder, collection: string, name: string, value: number): Knex.QueryBuilder {
		return dbQuery.orWhereRaw(`??.?? = ?`, [collection, name, value]);
	}
}
