import { useEnv } from '@directus/env';
import type { Knex } from 'knex';
import { getDefaultIndexName } from '../../../../utils/get-default-index-name.js';
import { SchemaHelper, type CreateIndexOptions, type SortRecord } from '../types.js';

const env = useEnv();

export class SchemaHelperMySQL extends SchemaHelper {
	override generateIndexName(
		type: 'unique' | 'foreign' | 'index',
		collection: string,
		fields: string | string[],
	): string {
		return getDefaultIndexName(type, collection, fields, { maxLength: 64 });
	}

	override async getDatabaseSize(): Promise<number | null> {
		try {
			const result = (await this.knex
				.sum('size AS size')
				.from(
					this.knex
						.select(this.knex.raw('data_length + index_length AS size'))
						.from('information_schema.TABLES')
						.where('table_schema', '=', String(env['DB_DATABASE']))
						.as('size'),
				)) as Record<string, any>[];

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
			** MySQL **

			MySQL only requires all selected sort columns that are not functionally dependent on the primary key to be included.

			> If the ONLY_FULL_GROUP_BY SQL mode is enabled (which it is by default),
				MySQL rejects queries for which the select list, HAVING condition, or ORDER BY list refer to
				nonaggregated columns that are neither named in the GROUP BY clause nor are functionally dependent on them.

			https://dev.mysql.com/doc/refman/8.4/en/group-by-handling.html

			MySQL allows aliases to be used in the GROUP BY clause

			> You can use the alias in GROUP BY, ORDER BY, or HAVING clauses to refer to the column:

			https://dev.mysql.com/doc/refman/8.4/en/problems-with-alias.html

			** MariaDB **

			MariaDB does not document how it supports functional dependent columns in GROUP BY clauses.
			But testing shows that it does support the same features as MySQL in this area.

			MariaDB allows aliases to be used in the GROUP BY clause

			> The GROUP BY expression can be a computed value, and can refer back to an identifer specified with AS.

			https://mariadb.com/kb/en/group-by/#group-by-examples
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

		const blockingQuery = this.knex.raw(`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX ?? ON ?? (${placeholders})`, [
			constraintName,
			collection,
			...fields,
		]);

		if (options.attemptConcurrentIndex) {
			/*
			Seems it is not possible to determine whether "ALGORITHM=INPLACE LOCK=NONE" will be supported
			so we're just going to send it and fall back to blocking index creation on error
			
			https://dev.mysql.com/doc/refman/8.4/en/create-index.html#:~:text=engine%20is%20changed.-,Table%20Copying%20and%20Locking%20Options,-ALGORITHM%20and%20LOCK
			*/
			return this.knex
				.raw(`CREATE ${isUnique ? 'UNIQUE ' : ''}INDEX ?? ON ?? (${placeholders}) ALGORITHM=INPLACE LOCK=NONE`, [
					constraintName,
					collection,
					...fields,
				])
				.catch(() => blockingQuery);
		}

		return blockingQuery;
	}
}
