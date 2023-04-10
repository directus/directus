import type { Knex } from 'knex';
import { SchemaHelper } from '../types.js';

export class SchemaHelperMSSQL extends SchemaHelper {
	override applyLimit(rootQuery: Knex.QueryBuilder, limit: number): void {
		// The ORDER BY clause is invalid in views, inline functions, derived tables, subqueries,
		// and common table expressions, unless TOP, OFFSET or FOR XML is also specified.
		if (limit === -1) {
			rootQuery.limit(Number.MAX_SAFE_INTEGER);
		} else {
			rootQuery.limit(limit);
		}
	}

	override applyOffset(rootQuery: Knex.QueryBuilder, offset: number): void {
		rootQuery.offset(offset);
		rootQuery.orderBy(1);
	}

	override formatUUID(uuid: string): string {
		return uuid.toUpperCase();
	}
}
