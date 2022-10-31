import { Knex } from 'knex';
import { JsonHelper } from '../types';

export class JsonHelperPostgres extends JsonHelper {
	applyFields(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		return dbQuery.select(
			this.nodes.map((node) => {
				const { dbType } = this.schema.collections[table].fields[node.name];
				return this.knex.raw(
					dbType === 'jsonb' ? 'jsonb_path_query_array(??, ?) as ??' : 'json_path_query_array(??, ?) as ??',
					[`${table}.${node.name}`, node.queryPath, node.fieldKey]
				);
			})
		);
	}
}
