import { DatabaseHelper } from '../types';
import { Knex } from 'knex';
import { SchemaOverview } from '@directus/shared/types';
import { JsonFieldNode } from '../../../types';

export const JSON_FEATURES = ['JSON_QUERYING', 'JSON_WILDCARDS', 'JSON_JOINING'] as const;
export type SupportedJsonFeature = typeof JSON_FEATURES[number];

export abstract class JsonHelper extends DatabaseHelper {
	constructor(protected knex: Knex, protected schema: SchemaOverview, protected nodes: JsonFieldNode[] = []) {
		super(knex);
		this.schema = schema;
		this.nodes = nodes;
	}

	applyFields(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		return dbQuery.select(
			this.nodes.map((node) => {
				return this.knex.raw(this.knex.jsonExtract(`${table}.${node.name}`, node.queryPath, node.fieldKey, false));
			})
		);
	}
	applyJoins(dbQuery: Knex.QueryBuilder): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		// empty stub
		return dbQuery;
	}
	applyQuery(dbQuery: Knex.QueryBuilder): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		// empty stub
		return dbQuery;
	}
}
