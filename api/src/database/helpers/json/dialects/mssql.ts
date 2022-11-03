import { Knex } from 'knex';
import { JsonFieldNode } from '../../../../types';
import { JsonHelperDefault } from './default';

/**
 * We may want a fallback to support wildcard queries (will be super slow unfortunately)
 */
export class JsonHelperMSSQL extends JsonHelperDefault {
	applyFields(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		const selectQueries = this.nodes.filter(({ queryPath }) => queryPath.indexOf('*') === -1);
		const joinQueries = this.nodes.filter(({ queryPath }) => queryPath.indexOf('*') > 0);
		if (joinQueries.length > 0) {
			// no viable solutions found yet without JSON_ARRAY support
		}
		if (selectQueries.length > 0) {
			dbQuery = dbQuery.select(this.nodes.map((node) => this.jsonQueryOrValue(`${table}.${node.name}`, node)));
		}
		return dbQuery;
	}
	private jsonQueryOrValue(field: string, node: JsonFieldNode): Knex.Raw {
		const qPath = this.knex.raw('?', [node.queryPath]).toQuery();
		return this.knex.raw(`COALESCE(JSON_QUERY(??, ${qPath}), JSON_VALUE(??, ${qPath})) as ??`, [
			field,
			field,
			node.fieldKey,
		]);
	}
}
