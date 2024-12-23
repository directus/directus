import { useEnv } from '@directus/env';
import type { Knex } from 'knex';
import { SchemaHelper, type SortRecord, type Sql } from '../types.js';
import { prepQueryParams } from '../utils/prep-query-params.js';

const env = useEnv();

export class SchemaHelperPostgres extends SchemaHelper {
	override async getDatabaseSize(): Promise<number | null> {
		try {
			const result = await this.knex.select(this.knex.raw(`pg_database_size(?) as size;`, [env['DB_DATABASE']]));

			return result[0]?.['size'] ? Number(result[0]?.['size']) : null;
		} catch {
			return null;
		}
	}

	override prepQueryParams(queryParams: Sql): Sql {
		return prepQueryParams(queryParams, { format: (index) => `$${index + 1}` });
	}

	override addInnerSortFieldsToGroupBy(
		groupByFields: (string | Knex.Raw)[],
		sortRecords: SortRecord[],
		hasRelationalSort: boolean,
	) {
		if (hasRelationalSort) {
			/*
			Postgres only requires selected columns that are not functionally dependent on the primary key to be
			included in the GROUP BY clause. Since the results are already grouped by the primary key, we don't need to
			always include the sort columns in the GROUP BY but only if there is a relational sort involved, eg.
			a sort column that comes from a related M2O relation.

			> When GROUP BY is present, or any aggregate functions are present, it is not valid for the SELECT list
			  expressions to refer to ungrouped columns except within aggregate functions or when the ungrouped column is
			  functionally dependent on the grouped columns, since there would otherwise be more than one possible value to
			  return for an ungrouped column.
			https://www.postgresql.org/docs/current/sql-select.html

			Postgres allows aliases to be used in the GROUP BY clause

			> In strict SQL, GROUP BY can only group by columns of the source table but PostgreSQL extends this to also allow
			  GROUP BY to group by columns in the select list.
      https://www.postgresql.org/docs/16/queries-table-expressions.html#QUERIES-GROUP
			 */

			groupByFields.push(...sortRecords.map(({ alias }) => alias));
		}
	}
}
