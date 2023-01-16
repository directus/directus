import { Knex } from 'knex';
import { getDatabaseVersion } from '../../../../database';
import { SchemaHelper } from '../types';

export class SchemaHelperMySQL extends SchemaHelper {
	applyMultiRelationalSort(
		knex: Knex,
		dbQuery: Knex.QueryBuilder,
		table: string,
		primaryKey: string,
		orderByString: string,
		orderByFields: Knex.Raw[]
	): Knex.QueryBuilder {
		if (getDatabaseVersion()?.startsWith('5.7')) {
			dbQuery.orderByRaw(`?? asc, ${orderByString}`, [`${table}.${primaryKey}`, ...orderByFields]);

			dbQuery = knex
				.select(
					knex.raw(
						`??, ( @rank := IF ( @cur_id = deep.${primaryKey}, @rank + 1, 1 ) ) AS directus_row_number, ( @cur_id := deep.${primaryKey} ) AS current_id`,
						'deep.*'
					)
				)
				.from(knex.raw('? as ??, (SELECT @rank := 0,  @cur_id := null) vars', [dbQuery, 'deep']));

			return dbQuery;
		}

		return super.applyMultiRelationalSort(knex, dbQuery, table, primaryKey, orderByString, orderByFields);
	}
}
