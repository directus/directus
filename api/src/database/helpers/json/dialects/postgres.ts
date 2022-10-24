import { JsonHelper } from '../types';
import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';

export class JsonHelperPostgres extends JsonHelper {
	jsonColumn(table: string, column: string, path: string, alias: string) {
		// using `jsonb_path_query_array` to keep consistent behavior across databases.
		// does this exception allow to use the `json` fields instead of migrating to `jsonb`?
		return this.knex.raw('jsonb_path_query_array(??, ?) as ??', [`${table}.${column}`, path, alias]);
	}
	jsonQuery(table: string, query: Knex.QueryBuilder, fields: JsonFieldNode[]) {
		if (fields.length === 0) return query;
		for (const field of fields) {
			query = query.select(this.knex.jsonExtract(`${table}.${field.name}`, field.queryPath, field.fieldKey, false));
		}
		return query;
	}
}
