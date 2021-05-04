import KnexPostgres from 'knex-schema-inspector/dist/dialects/postgres';
import { SchemaOverview } from '../types/overview';
import { SchemaInspector } from '../types/schema';

export default class Postgres extends KnexPostgres implements SchemaInspector {
	async overview(): Promise<SchemaOverview> {
		const [columnsResult, primaryKeysResult] = await Promise.all([
			// Only select columns from BASE TABLEs to exclude views (Postgres views
			// cannot have primary keys so they cannot be used)
			this.knex.raw(
				`
        SELECT
          c.table_name,
          c.column_name,
          c.column_default as default_value,
          c.is_nullable,
          c.data_type
        FROM
          information_schema.columns c
        LEFT JOIN information_schema.tables t
          ON c.table_name = t.table_name
        WHERE
          t.table_type = 'BASE TABLE'
          AND c.table_schema IN (?);
      `,
				[this.explodedSchema.join(',')]
			),

			this.knex.raw(
				`
        SELECT
          relname as table_name,
          pg_attribute.attname as column_name
        FROM
          pg_index,
          pg_class,
          pg_attribute,
          pg_namespace
        WHERE
          indrelid = pg_class.oid
          AND nspname IN (?)
          AND pg_class.relnamespace = pg_namespace.oid
          AND pg_attribute.attrelid = pg_class.oid
          AND pg_attribute.attnum = ANY (pg_index.indkey)
          AND indisprimary
      `,
				[this.explodedSchema.join(',')]
			),
		]);

		const columns = columnsResult.rows;
		const primaryKeys = primaryKeysResult.rows;

		const overview: SchemaOverview = {};

		for (const column of columns) {
			if (column.table_name in overview === false)
				overview[column.table_name] = {
					primary: primaryKeys.find(
						(key: { table_name: string; column_name: string }) => key.table_name === column.table_name
					)?.column_name,
					columns: {},
				};

			overview[column.table_name].columns[column.column_name] = {
				...column,
				default_value: column.default_value?.startsWith('nextval(')
					? 'AUTO_INCREMENT'
					: this.parseDefaultValue(column.default_value),
				is_nullable: column.is_nullable === 'YES',
			};
		}

		return overview;
	}
}
