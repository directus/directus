import KnexMSSQL, { parseDefaultValue } from 'knex-schema-inspector/dist/dialects/mssql';
import { SchemaOverview } from '../types/overview';
import { SchemaInspector } from '../types/schema';

export default class MSSQL extends KnexMSSQL implements SchemaInspector {
	// Overview
	// ===============================================================================================
	async overview(): Promise<SchemaOverview> {
		const columns = await this.knex.raw(
			`
			SELECT
				c.TABLE_NAME as table_name,
				c.COLUMN_NAME as column_name,
				c.COLUMN_DEFAULT as default_value,
				c.IS_NULLABLE as is_nullable,
				c.DATA_TYPE as data_type,
				c.CHARACTER_MAXIMUM_LENGTH as max_length,
				pk.PK_SET as column_key,
				COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') as is_identity
			FROM
				[${this.knex.client.database()}].INFORMATION_SCHEMA.COLUMNS as c
			LEFT JOIN (
				SELECT
					PK_SET = CASE WHEN CONSTRAINT_NAME LIKE '%pk%' THEN 'PRIMARY' ELSE NULL END,
					TABLE_NAME,
					CONSTRAINT_CATALOG,
					COLUMN_NAME
				FROM [${this.knex.client.database()}].INFORMATION_SCHEMA.KEY_COLUMN_USAGE
			) as pk
			ON [c].[TABLE_NAME] = [pk].[TABLE_NAME]
			AND [c].[TABLE_CATALOG] = [pk].[CONSTRAINT_CATALOG]
			AND [c].[COLUMN_NAME] = [pk].[COLUMN_NAME]
			INNER JOIN
				[${this.knex.client.database()}].INFORMATION_SCHEMA.TABLES as t
			ON [c].[TABLE_NAME] = [t].[TABLE_NAME]
			AND [c].[TABLE_CATALOG] = [t].[TABLE_CATALOG]
			AND [t].TABLE_TYPE = 'BASE TABLE'
			`
		);

		const overview: SchemaOverview = {};

		for (const column of columns) {
			if (column.table_name in overview === false) {
				overview[column.table_name] = {
					primary: columns.find((nested: { column_key: string; table_name: string }) => {
						return nested.table_name === column.table_name && nested.column_key === 'PRIMARY';
					})?.column_name,
					columns: {},
				};
			}

			overview[column.table_name].columns[column.column_name] = {
				...column,
				default_value: column.is_identity ? 'AUTO_INCREMENT' : parseDefaultValue(column.default_value),
				is_nullable: column.is_nullable === 'YES',
			};
		}

		return overview;
	}
}
