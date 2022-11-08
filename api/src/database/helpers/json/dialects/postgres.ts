import { Knex } from 'knex';
import { JsonHelperDefault } from './default';

export class JsonHelperPostgres extends JsonHelperDefault {
	static isSupported(version: string, _full = ''): boolean {
		if (version === '-') return false;
		const major = parseInt(version.split('.')[0]);
		// we're currently only supporting the 14+ version untill other exceptions have been added
		return major >= 14;
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
