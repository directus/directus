import { Knex } from 'knex';
import { JsonHelperDefault } from './default';
/**
 * We need to start using JSON_TABLE over JSON_QUERY for Oracle to support more complex wildcard queries
 */
export class JsonHelperOracle extends JsonHelperDefault {
	applyFields(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		return dbQuery.select(
			this.nodes.map((node) => {
				const query = this.knex.raw('?', [node.jsonPath]).toQuery();
				return this.knex.raw(`COALESCE(json_query(??.??, ${query}),json_value(??.??, ${query})) as ??`, [
					table,
					node.name,
					table,
					node.name,
					node.fieldKey,
				]);
			})
		);
	}
}
