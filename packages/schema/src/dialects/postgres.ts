import KnexPostgres, { parseDefaultValue } from 'knex-schema-inspector/dist/dialects/postgres';
import { Column } from 'knex-schema-inspector/dist/types/column';
import { SchemaOverview } from '../types/overview';
import { SchemaInspector } from '../types/schema';

export default class Postgres extends KnexPostgres implements SchemaInspector {
	async overview(): Promise<SchemaOverview> {
		type RawColumn = {
			table_name: string;
			column_name: string;
			default_value: string | null;
			data_type: string;
			max_length: number | null;
			is_identity: boolean;
			is_nullable: boolean;
			is_generated: boolean;
		};

		type RawGeometryColumn = {
			table_name: string;
			column_name: string;
			data_type: string;
		};

		const bindings = this.explodedSchema.map(() => '?').join(',');

		const [columnsResult, primaryKeysResult] = await Promise.all([
			// Only select columns from BASE TABLEs to exclude views (Postgres views
			// cannot have primary keys so they cannot be used)
			this.knex.raw(
				`
        SELECT c.table_name
          , c.column_name
          , c.column_default as default_value
          , c.data_type
			 		, c.character_maximum_length as max_length
          , c.is_generated = 'ALWAYS' is_generated
          , CASE WHEN c.is_identity = 'YES' THEN true ELSE false END is_identity
          , CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END is_nullable
        FROM
          information_schema.columns c
        LEFT JOIN information_schema.tables t
          ON c.table_name = t.table_name
        WHERE
          t.table_type = 'BASE TABLE'
          AND c.table_schema IN (${bindings});
      `,
				this.explodedSchema
			),

			this.knex.raw(
				`
        SELECT relname as table_name
          , pg_attribute.attname as column_name
        FROM pg_index
          , pg_class
          , pg_attribute
          , pg_namespace
        WHERE
          indrelid = pg_class.oid
          AND nspname IN (${bindings})
          AND pg_class.relnamespace = pg_namespace.oid
          AND pg_attribute.attrelid = pg_class.oid
          AND pg_attribute.attnum = ANY (pg_index.indkey)
          AND indisprimary
          AND indnatts = 1
			 AND relkind != 'S'
      `,
				this.explodedSchema
			),
		]);

		const columns: RawColumn[] = columnsResult.rows;
		const primaryKeys = primaryKeysResult.rows;
		let geometryColumns: RawGeometryColumn[] = [];

		// Before we fetch the available geometry types, we'll have to ensure PostGIS exists
		// in the first place. If we don't, the transaction would error out due to the exception in
		// SQL, which we can't catch in JS.
		const hasPostGIS =
			(await this.knex.raw(`SELECT oid FROM pg_proc WHERE proname = 'postgis_version'`)).rows.length > 0;

		if (hasPostGIS) {
			const result = await this.knex.raw<{ rows: RawGeometryColumn[] }>(
				`WITH geometries as (
					select * from geometry_columns
					union
					select * from geography_columns
				)
				SELECT f_table_name as table_name
					, f_geometry_column as column_name
					, type as data_type
				FROM geometries g
				JOIN information_schema.tables t
					ON g.f_table_name = t.table_name
					AND t.table_type = 'BASE TABLE'
				WHERE f_table_schema in (${bindings})
				`,
				this.explodedSchema
			);

			geometryColumns = result.rows;
		}

		const overview: SchemaOverview = {};

		for (const column of columns) {
			if (column.is_identity || column.default_value?.startsWith('nextval(')) {
				column.default_value = 'AUTO_INCREMENT';
			} else {
				column.default_value = parseDefaultValue(column.default_value);
			}

			if (column.table_name in overview === false) {
				overview[column.table_name] = { columns: {}, primary: <any>undefined };
			}
			if (['point', 'polygon'].includes(column.data_type)) {
				column.data_type = 'unknown';
			}
			overview[column.table_name].columns[column.column_name] = column;
		}

		for (const { table_name, column_name } of primaryKeys) {
			if (table_name in overview) {
				overview[table_name].primary = column_name;
			} else {
				// TODO: maybe display an error message to the user, so postgres permissions the directus user/role get's fixed
			}
		}
		for (const { table_name, column_name, data_type } of geometryColumns) {
			if (table_name in overview) {
				overview[table_name].columns[column_name].data_type = data_type;
			}
		}

		return overview;
	}

	// This is required as PostGIS data types are not accessible from the
	// information_schema. We have to fetch them from geography_columns
	columnInfo(): Promise<Column[]>;
	columnInfo(table: string): Promise<Column[]>;
	columnInfo(table: string, column: string): Promise<Column>;
	async columnInfo(table?: string, column?: string): Promise<Column | Column[]> {
		// Call the parent columnInfo()
		// @ts-ignore
		const columns = await super.columnInfo(table, column);
		if (!columns?.length) {
			return columns;
		}

		for (const column of Array.isArray(columns) ? columns : [columns]) {
			if (['point', 'polygon'].includes(column.data_type)) {
				column.data_type = 'unknown';
			}
		}

		const hasPostGIS =
			(await this.knex.raw(`SELECT oid FROM pg_proc WHERE proname = 'postgis_version'`)).rows.length > 0;

		if (!hasPostGIS) {
			return columns;
		}

		const query = this.knex
			.with(
				'geometries',
				this.knex.raw(`
				select * from geometry_columns
				union
				select * from geography_columns
		`)
			)
			.select<Column[]>({
				table: 'f_table_name',
				name: 'f_geometry_column',
				data_type: 'type',
			})
			.from('geometries')
			.whereIn('f_table_schema', this.explodedSchema);

		if (table) {
			query.andWhere('f_table_name', table);
		}
		if (column) {
			const geometry = await query.andWhere('f_geometry_column', column).first();
			if (geometry) {
				columns.data_type = geometry.data_type;
			}
		}
		const geometries = await query;
		for (const column of columns) {
			const geometry = geometries.find((geometry) => {
				return column.name == geometry.name && column.table == geometry.table;
			});
			if (geometry) {
				column.data_type = geometry.data_type;
			}
		}
		return columns;
	}
}
