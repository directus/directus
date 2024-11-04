import type { Knex } from 'knex';
import { SchemaHelper, type SortRecord, type Sql } from '../types.js';
import { preprocessBindings } from '../utils/preprocess-bindings.js';

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

	override preprocessBindings(queryParams: Sql): Sql {
		return preprocessBindings(queryParams, { format: (index) => `@p${index}` });
	}

	override addInnerSortFieldsToGroupBy(
		groupByFields: (string | Knex.Raw)[],
		sortRecords: SortRecord[],
		_hasRelationalSort: boolean,
	) {
		/*
		MSSQL requires all selected columns that are not aggregated over are to be present in the GROUP BY clause

		> When the select list has no aggregations, each column in the select list must be included in the GROUP BY list.

		https://learn.microsoft.com/en-us/sql/t-sql/queries/select-group-by-transact-sql?view=sql-server-ver16#g-syntax-variations-for-group-by

		MSSQL does not support aliases in the GROUP BY clause

		> The column expression cannot contain:
			A column alias that is defined in the SELECT list. It can use a column alias for a derived table that is defined
			in the FROM clause.

		https://learn.microsoft.com/en-us/sql/t-sql/queries/select-group-by-transact-sql?view=sql-server-ver16
		 */

		if (sortRecords.length > 0) {
			groupByFields.push(...sortRecords.map(({ column }) => column));
		}
	}
}
