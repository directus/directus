import { JsonHelper } from '../types';
import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';

export class JsonHelperDefault extends JsonHelper {
	jsonColumn(table: string, column: string, path: string, alias: string) {
		return this.knex.raw(this.knex.jsonExtract(`${table}.${column}`, path, alias, false));
	}
	jsonQuery(table: string, query: Knex.QueryBuilder, fields: JsonFieldNode[]) {
		if (fields.length === 0) return query;
		for (const field of fields) {
			query = query.select(this.knex.jsonExtract(`${table}.${field.name}`, field.queryPath, field.fieldKey, false));
		}
		return query;
	}
}
