import { useEnv } from '@directus/env';
import type { Knex } from 'knex';
import { getDatabaseVersion } from '../../../index.js';
import { SchemaHelper } from '../types.js';

const env = useEnv();

export class SchemaHelperMySQL extends SchemaHelper {
	override applyMultiRelationalSort(
		knex: Knex,
		dbQuery: Knex.QueryBuilder,
		table: string,
		primaryKey: string,
		orderByString: string,
		orderByFields: Knex.Raw[],
	): Knex.QueryBuilder {
		if (getDatabaseVersion()?.startsWith('5.7')) {
			dbQuery.orderByRaw(`?? asc, ${orderByString}`, [`${table}.${primaryKey}`, ...orderByFields]);

			dbQuery = knex
				.select(
					knex.raw(
						`??, ( @rank := IF ( @cur_id = deep.${primaryKey}, @rank + 1, 1 ) ) AS directus_row_number, ( @cur_id := deep.${primaryKey} ) AS current_id`,
						'deep.*',
					),
				)
				.from(knex.raw('? as ??, (SELECT @rank := 0,  @cur_id := null) vars', [dbQuery, 'deep']));

			return dbQuery;
		}

		return super.applyMultiRelationalSort(knex, dbQuery, table, primaryKey, orderByString, orderByFields);
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
}
