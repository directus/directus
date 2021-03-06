import KnexMySQL from 'knex-schema-inspector/dist/dialects/mysql';
import { SchemaOverview } from '../types/overview';
import { SchemaInspector } from '../types/schema';

export default class MySQL extends KnexMySQL implements SchemaInspector {
	async overview() {
		const columns = await this.knex.raw(
			`
			SELECT
				TABLE_NAME as table_name,
				COLUMN_NAME as column_name,
				COLUMN_DEFAULT as default_value,
				IS_NULLABLE as is_nullable,
				DATA_TYPE as data_type,
				COLUMN_KEY as column_key,
				EXTRA as extra
			FROM
				INFORMATION_SCHEMA.COLUMNS
			WHERE
				table_schema = ?;
			`,
			[this.knex.client.database()]
		);

		const overview: SchemaOverview = {};

		for (const column of columns[0]) {
			if (column.table_name in overview === false) {
				overview[column.table_name] = {
					primary: columns[0].find((nested: { column_key: string; table_name: string }) => {
						return nested.table_name === column.table_name && nested.column_key === 'PRI';
					})?.column_name,
					columns: {},
				};
			}

			overview[column.table_name].columns[column.column_name] = {
				...column,
				default_value: column.extra === 'auto_increment' ? 'AUTO_INCREMENT' : column.default_value,
				is_nullable: column.is_nullable === 'YES',
			};
		}

		return overview;
	}
}
