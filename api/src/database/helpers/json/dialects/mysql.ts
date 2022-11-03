import { Knex } from 'knex';
import { JsonHelperDefault } from './default';

/**
 * We may want a fallback to support wildcard queries (will be super slow unfortunately)
 */
export class JsonHelperMySQL extends JsonHelperDefault {
	applyFields(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		return dbQuery.select(
			this.nodes.map((node) => {
				const q = this.knex.raw('?', [node.queryPath]).toQuery();
				return this.knex.raw(`??.??->${q} as ??`, [table, node.name, node.fieldKey]);
			})
		);
	}
}
