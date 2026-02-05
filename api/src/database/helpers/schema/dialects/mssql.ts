import type { Knex } from 'knex';
import { getDefaultIndexName } from '../../../../utils/get-default-index-name.js';
import { type CreateIndexOptions, SchemaHelper, type SortRecord, type Sql } from '../types.js';
import { prepQueryParams } from '../utils/prep-query-params.js';

export class SchemaHelperMSSQL extends SchemaHelper {
	override generateIndexName(
		type: 'unique' | 'foreign' | 'index',
		collection: string,
		fields: string | string[],
	): string {
		return getDefaultIndexName(type, collection, fields, { maxLength: 128 });
	}

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

	override prepQueryParams(queryParams: Sql): Sql {
		return prepQueryParams(queryParams, { format: (index) => `@p${index}` });
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

	override getColumnNameMaxLength(): number {
		return 128;
	}

	override getTableNameMaxLength(): number {
		return 128;
	}

	override async createIndex(
		collection: string,
		field: string,
		options: CreateIndexOptions = {},
	): Promise<Knex.SchemaBuilder> {
		const isUnique = Boolean(options.unique);
		const constraintName = this.generateIndexName(isUnique ? 'unique' : 'index', collection, field);

		/*
		Online index operations are not available in every edition of Microsoft SQL Server.
		For a list of features that are supported by the editions of SQL Server, see Editions and supported features of SQL Server 2022.

		https://learn.microsoft.com/en-us/sql/sql-server/editions-and-components-of-sql-server-2022?view=sql-server-ver16#rdbms-high-availability
		 */
		const edition = await this.knex
			.raw<{ edition?: string }[]>(`SELECT SERVERPROPERTY('edition') AS edition`)
			.then((data) => data?.[0]?.['edition']);

		if (options.attemptConcurrentIndex && typeof edition === 'string' && edition.startsWith('Enterprise')) {
			// https://learn.microsoft.com/en-us/sql/t-sql/statements/create-index-transact-sql?view=sql-server-ver16#online---on--off-
			return this.knex.raw(`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX ?? ON ?? (??) WITH (ONLINE = ON)`, [
				constraintName,
				collection,
				field,
			]);
		}

		// Fall back to blocking index creation for non-enterprise editions
		return this.knex.raw(`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX ?? ON ?? (??)`, [constraintName, collection, field]);
	}
}
