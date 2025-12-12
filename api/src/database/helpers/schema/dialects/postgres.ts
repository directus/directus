import { useEnv } from '@directus/env';
import type { Knex } from 'knex';
import { getDefaultIndexName } from '../../../../utils/get-default-index-name.js';
import { SchemaHelper, type CreateIndexOptions, type SortRecord } from '../types.js';

const env = useEnv();

export class SchemaHelperPostgres extends SchemaHelper {
	override generateIndexName(
		type: 'unique' | 'foreign' | 'index',
		collection: string,
		fields: string | string[],
	): string {
		return getDefaultIndexName(type, collection, fields, { maxLength: 63 });
	}

	override async getDatabaseSize(): Promise<number | null> {
		try {
			const result = await this.knex.select(this.knex.raw(`pg_database_size(?) as size;`, [env['DB_DATABASE']]));

			return result[0]?.['size'] ? Number(result[0]?.['size']) : null;
		} catch {
			return null;
		}
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

	override async createIndex(
		collection: string,
		field: string | string[],
		options: CreateIndexOptions = {},
	): Promise<Knex.SchemaBuilder> {
		const fields = Array.isArray(field) ? field : [field];
		const isUnique = Boolean(options.unique);
		const constraintName = this.generateIndexName(isUnique ? 'unique' : 'index', collection, fields);
		const placeholders = fields.map(() => '??').join(', ');

		// https://www.postgresql.org/docs/current/sql-createindex.html#SQL-CREATEINDEX-CONCURRENTLY
		if (options.attemptConcurrentIndex) {
			return this.knex.raw(`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX CONCURRENTLY ?? ON ?? (${placeholders})`, [
				constraintName,
				collection,
				...fields,
			]);
		}

		return this.knex.raw(`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX ?? ON ?? (${placeholders})`, [
			constraintName,
			collection,
			...fields,
		]);
	}
}
