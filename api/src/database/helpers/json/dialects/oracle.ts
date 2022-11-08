import { Knex } from 'knex';
import { JsonHelperDefault } from './default';
/**
 * We need to start using JSON_TABLE over JSON_QUERY for Oracle to support more complex wildcard queries
 */
export class JsonHelperOracle extends JsonHelperDefault {
	static isSupported(version: string): boolean {
		if (version === '-') return false;
		const major = parseInt(version.split('.')[0]);
		// json support added in version 12c
		// https://docs.oracle.com/en/database/oracle/oracle-database/12.2/adjsn/function-JSON_QUERY.html#GUID-D64C7BE9-335D-449C-916D-1123539BF1FB
		return major > 12;
	}
	preProcess(dbQuery: Knex.QueryBuilder, table: string): Knex.QueryBuilder {
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
