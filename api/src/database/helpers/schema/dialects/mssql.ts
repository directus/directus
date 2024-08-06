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

	override async getDatabaseSize(): Promise<number | null> {
		try {
			const result = await this.knex.raw('SELECT SUM(size) * 8192 AS size FROM sys.database_files;');

			return result[0]?.['size'] ? Number(result[0]?.['size']) : null;
		} catch {
			return null;
		}
	}
}
