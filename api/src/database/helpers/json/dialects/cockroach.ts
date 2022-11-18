import { Knex } from 'knex';
import { JsonHelperDefault } from './default';

export class JsonHelperCockroachDB extends JsonHelperDefault {
	preProcess(dbQuery: Knex.QueryBuilder, table: string): void {
		dbQuery
			.select(
				this.nodes.map((node) => {
					const { dbType } = this.schema.collections[table].fields[node.name];
					return this.knex.raw(
						dbType === 'jsonb' ? 'jsonb_extract_path(??, ?) as ??' : 'jsonb_extract_path(to_jsonb(??), ?) as ??',
						[`${table}.${node.name}`, node.jsonPath, node.fieldKey]
					);
				})
			)
			.from(table);
	}
}
