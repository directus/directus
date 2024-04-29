import type { Type } from '@directus/types';
import type { Knex } from 'knex';
import { DatabaseHelper } from '../types.js';

export class NumberWhereHelpers extends DatabaseHelper {
	orWhere(dbQuery: Knex.QueryBuilder, collection: string, name: string, value: number | bigint): Knex.QueryBuilder {
		return dbQuery.orWhere({ [`${collection}.${name}`]: value });
	}

	numberValid(_value: number | bigint, _info: { type: Type; precision: number | null; scale: number | null }) {
		return true;
	}
}
