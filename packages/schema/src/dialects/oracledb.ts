import KnexOracle from 'knex-schema-inspector/dist/dialects/oracledb';
import { SchemaOverview } from '../types/overview';
import { SchemaInspector } from '../types/schema';

export default class Oracle extends KnexOracle implements SchemaInspector {
	async overview() {
		const columns = await this.knex.raw(`
			SELECT
				"USER_TAB_COLUMNS"."TABLE_NAME" AS table_name,
				"USER_TAB_COLUMNS"."COLUMN_NAME" AS column_name,
				"USER_TAB_COLUMNS"."DATA_DEFAULT" AS default_value,
				"USER_TAB_COLUMNS"."NULLABLE" AS is_nullable,
				"USER_TAB_COLUMNS"."DATA_TYPE" AS data_type,
				"USER_TAB_COLUMNS"."DATA_PRECISION" AS numeric_precision,
				"USER_TAB_COLUMNS"."DATA_SCALE" AS numeric_scale,
				"USER_CONSTRAINTS"."CONSTRAINT_TYPE" AS column_key
			FROM
				"USER_TAB_COLUMNS"
				LEFT JOIN "USER_CONS_COLUMNS" ON "USER_TAB_COLUMNS"."TABLE_NAME" = "USER_CONS_COLUMNS"."TABLE_NAME"
					AND "USER_TAB_COLUMNS"."COLUMN_NAME" = "USER_CONS_COLUMNS"."COLUMN_NAME"
				LEFT JOIN "USER_CONSTRAINTS" ON "USER_CONS_COLUMNS"."CONSTRAINT_NAME" = "USER_CONSTRAINTS"."CONSTRAINT_NAME"
		`);

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
