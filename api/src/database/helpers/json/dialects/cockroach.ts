import { Knex } from 'knex';
import { JsonHelperDefault } from './default';

export class JsonHelperCockroachDB extends JsonHelperDefault {
	static isSupported(version: string): boolean {
		if (version === '-') return false;
		const major = parseInt(version.substring(1).split('.')[0]);
		// apparently cockroach DB supports JSON since v2
		return major >= 2;
	}
	preProcess(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
		if (this.nodes.length === 0) return dbQuery;
		return dbQuery.select(
			this.nodes.map((node) => {
				const { dbType } = this.schema.collections[table].fields[node.name];
				return this.knex.raw(
					dbType === 'jsonb' ? 'jsonb_path_query_array(??, ?) as ??' : 'jsonb_path_query_array(to_jsonb(??), ?) as ??',
					[`${table}.${node.name}`, node.jsonPath, node.fieldKey]
				);
			})
		);
	}
}
