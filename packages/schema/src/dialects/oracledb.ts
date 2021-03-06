import KnexOracle from 'knex-schema-inspector/dist/dialects/oracledb';
import { SchemaOverview } from '../types/overview';
import { SchemaInspector } from '../types/schema';

export default class Oracle extends KnexOracle implements SchemaInspector {
	async overview() {
		const columns = await this.knex.raw(
			`
			SELECT
				c.TABLE_NAME as table_name,
				c.COLUMN_NAME as column_name,
				c.DATA_DEFAULT as default_value,
				c.NULLABLE as is_nullable,
				c.DATA_TYPE as data_type,
				pk.CONSTRAINT_TYPE as column_key
			FROM DBA_TAB_COLUMNS as c
			LEFT JOIN all_constraints as pk
				ON c.TABLE_NAME = pk.TABLE_NAME
				AND c.CONSTRAINT_NAME = pk.CONSTRAINT_NAME
				AND c.OWNER = pk.OWNER
			`
		);
		const overview: SchemaOverview = {};
		for (const column of columns[0]) {
			if (column.table_name in overview === false) {
				overview[column.table_name] = {
					primary: columns[0].find((nested: { column_key: string; table_name: string }) => {
						return nested.table_name === column.table_name && nested.column_key === 'P';
					})?.column_name,
					columns: {},
				};
			}
			overview[column.table_name].columns[column.column_name] = {
				...column,
				is_nullable: column.is_nullable === 'YES',
			};
		}
		return overview;
	}
}
