import KnexPostgres, { parseDefaultValue } from './knex-schema-inspector-postgres';
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
        WITH tables_views_and_foreign_tables AS (
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
            -- t.table_type = 'BASE TABLE'
            c.table_schema IN (${bindings})
        ),

        materialized_views AS (
          WITH inner_materialized_views AS (
            SELECT (current_database())::information_schema.sql_identifier AS table_catalog,
              (nc.nspname)::information_schema.sql_identifier AS table_schema,
              (c.relname)::information_schema.sql_identifier AS table_name,
              (
                CASE
                  WHEN ((pg_relation_is_updatable((c.oid)::regclass, FALSE) & 20) = 20) THEN 'YES'::TEXT
                  ELSE 'NO'::TEXT
                END)::information_schema.yes_or_no AS is_updatable,
              (
                CASE
                  WHEN ((pg_relation_is_updatable((c.oid)::regclass, FALSE) & 8) = 8) THEN 'YES'::TEXT
                  ELSE 'NO'::TEXT
                END)::information_schema.yes_or_no AS is_insertable_into
              FROM pg_namespace nc,
                pg_class c
              WHERE (
                (
                  ((c.relnamespace = nc.oid) AND (c.relkind = 'm'::"char")) AND (NOT pg_is_other_temp_schema(nc.oid))
                ) AND (
                  (pg_has_role(c.relowner, 'USAGE'::TEXT) OR has_table_privilege(c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'::TEXT))
                  OR has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES'::TEXT)
                )
              )
          ),

          attrs AS (
            SELECT t.relname AS table_name,
                   a.attname AS column_name,
                   pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
                   NOT a.attnotnull AS is_nullable
            FROM pg_attribute a
              JOIN pg_class t on a.attrelid = t.oid
              JOIN pg_namespace s on t.relnamespace = s.oid
            WHERE a.attnum > 0
              AND NOT a.attisdropped
			  -- TODO: handle double bindings:
              -- AND s.nspname = (${'' /*bindings*/})
            ORDER BY a.attnum
          )

          SELECT
            attrs.table_name,
            attrs.column_name,
            NULL AS default_value,
            attrs.data_type,
            NULL::INTEGER AS max_length,
            FALSE AS is_generated,
            FALSE AS is_identity,
            attrs.is_nullable
          FROM inner_materialized_views mv
          LEFT JOIN attrs
            ON attrs.table_name = mv.table_name
        )

        SELECT * FROM tables_views_and_foreign_tables
        UNION
        SELECT * FROM materialized_views;
      `,
				this.explodedSchema
			),

			this.knex.raw(
				`
      WITH tables AS (
        SELECT 'table' as type
          , relname as table_name
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
      ),
      views AS (
        WITH summary AS (
          SELECT 'view' AS type
            , c.table_name
            , column_name
            , ordinal_position AS rank
          FROM information_schema.columns c
          LEFT JOIN information_schema.tables t
            ON c.table_name = t.table_name
          WHERE t.table_type = 'VIEW'
        )
        SELECT type, table_name, column_name
        FROM summary
        WHERE rank = 1
      )
      SELECT * FROM tables
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
				// TODO: The id column should be defaulted to for non-basic tables for the time being
				overview[column.table_name] = { columns: {}, primary: 'id' };
			}
			if (['point', 'polygon'].includes(column.data_type)) {
				column.data_type = 'unknown';
			}
			overview[column.table_name].columns[column.column_name] = column;
		}

		for (const { table_name, column_name } of primaryKeys) {
			overview[table_name] ??= { columns: {}, primary: <any>undefined };
			overview[table_name].primary = column_name;
		}
		for (const { table_name, column_name, data_type } of geometryColumns) {
			overview[table_name].columns[column_name].data_type = data_type;
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
