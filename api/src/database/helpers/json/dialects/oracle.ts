import { Knex } from 'knex';
import { JsonHelper } from '../types';
/**
 * We need to start using JSON_TABLE over JSON_QUERY for Oracle to support more complex wildcard queries
 */
export class JsonHelperOracle extends JsonHelper {
	applyFields(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		return dbQuery.select(
			this.nodes.map((node) => {
				const query = this.knex.raw('? WITH CONDITIONAL WRAPPER', [node.queryPath]).toQuery();
				return this.knex.raw(`json_query(??.??, ${query}) as ??`, [table, node.name, node.fieldKey]);
			})
		);
	}
}
