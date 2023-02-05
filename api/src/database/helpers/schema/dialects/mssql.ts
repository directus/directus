import { Knex } from 'knex';
import { SchemaHelper } from '../types';

export class SchemaHelperMSSQL extends SchemaHelper {
	applyLimit(rootQuery: Knex.QueryBuilder, limit: number): void {
		// The ORDER BY clause is invalid in views, inline functions, derived tables, subqueries,
		// and common table expressions, unless TOP, OFFSET or FOR XML is also specified.
		if (limit === -1) {
			rootQuery.limit(Number.MAX_SAFE_INTEGER);
		} else {
			rootQuery.limit(limit);
		}
	}

	applyOffset(rootQuery: Knex.QueryBuilder, offset: number): void {
		rootQuery.offset(offset);
		rootQuery.orderBy(1);
	}

	formatUUID(uuid: string): string {
		return uuid.toUpperCase();
	}
}
