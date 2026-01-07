import type { Knex } from 'knex';
import type { Column } from '../types/column.js';
import type { SchemaOverview } from '../types/overview.js';
import type { SchemaInspector } from '../types/schema-inspector.js';
import type { Table } from '../types/table.js';
import { stripQuotes } from '../utils/strip-quotes.js';

type RawColumn = {
	name: string;
	table: string;
	schema: string;
	data_type: string;
	is_nullable: boolean;
	index_name: null | string;
	generation_expression: null | string;
	default_value: null | string;
	is_generated: boolean;
	max_length: null | number;
	comment: null | string;
	numeric_precision: null | number;
	numeric_scale: null | number;
};

type Constraint = {
	type: 'f' | 'p' | 'u';
	table: string;
	column: string;
	foreign_key_schema: null | string;
	foreign_key_table: null | string;
	foreign_key_column: null | string;
	has_auto_increment: null | boolean;
};

/**
 * Converts Postgres default value to JS
 * Eg `'example'::character varying` => `example`
 */
export function parseDefaultValue(value: string | null) {
	if (value === null) return null;
	if (value.startsWith('nextval(')) return value;

	value = value.split('::')[0] ?? null;

	if (value?.trim().toLowerCase() === 'null') return null;

	return stripQuotes(value);
}

export default class Postgres implements SchemaInspector {
	knex: Knex;
	schema: string;
	explodedSchema: string[];

	constructor(knex: Knex) {
		this.knex = knex;
		const config = knex.client.config;

		if (!config.searchPath) {
			this.schema = 'public';
			this.explodedSchema = [this.schema];
		} else if (typeof config.searchPath === 'string') {
			this.schema = config.searchPath;
			this.explodedSchema = [config.searchPath];
		} else {
			this.schema = config.searchPath[0];
			this.explodedSchema = config.searchPath;
		}
	}

	// Postgres specific
	// ===============================================================================================

	/**
	 * Set the schema to be used in other methods
	 */
	withSchema(schema: string) {
		this.schema = schema;
		this.explodedSchema = [this.schema];
		return this;
	}

	// Overview
	// ===============================================================================================

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
				this.explodedSchema,
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
				this.explodedSchema,
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
				this.explodedSchema,
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

			overview[column.table_name]!.columns[column.column_name] = column;
		}

		for (const { table_name, column_name } of primaryKeys) {
			if (overview[table_name]) {
				overview[table_name].primary = column_name;
			} else {
				/* eslint-disable-next-line no-console */
				console.error(`Could not set primary key "${column_name}" for unknown table "${table_name}"`);
			}
		}

		for (const { table_name, column_name, data_type } of geometryColumns) {
			if (overview[table_name]) {
				if (overview[table_name].columns[column_name]) {
					overview[table_name].columns[column_name].data_type = data_type;
				} else {
					/* eslint-disable-next-line no-console */
					console.error(
						`Could not set data type "${data_type}" for unknown column "${column_name}" in table "${table_name}"`,
					);
				}
			} else {
				/* eslint-disable-next-line no-console */
				console.error(`Could not set geometry column "${column_name}" for unknown table "${table_name}"`);
			}
		}

		return overview;
	}

	// Tables
	// ===============================================================================================

	/**
	 * List all existing tables in the current schema/database
	 */
	async tables() {
		const schemaIn = this.explodedSchema.map((schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`);

		const result = await this.knex.raw(
			`
		 SELECT
			rel.relname AS name
		 FROM
			pg_class rel
		 WHERE
			rel.relnamespace IN (${schemaIn})
			AND rel.relkind = 'r'
		 ORDER BY rel.relname
	  `,
		);

		return result.rows.map((row: { name: string }) => row.name);
	}

	/**
	 * Get the table info for a given table. If table parameter is undefined, it will return all tables
	 * in the current schema/database
	 */
	tableInfo(): Promise<Table[]>;
	tableInfo(table: string): Promise<Table>;
	async tableInfo(table?: string) {
		const schemaIn = this.explodedSchema.map((schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`);

		const bindings: any[] = [];
		if (table) bindings.push(table);

		const result = await this.knex.raw(
			`
		 SELECT
			rel.relnamespace::regnamespace::text AS schema,
			rel.relname AS name,
			des.description AS comment
		 FROM
			pg_class rel
		 LEFT JOIN pg_description des ON rel.oid = des.objoid AND des.objsubid = 0
		 WHERE
			rel.relnamespace IN (${schemaIn})
			${table ? 'AND rel.relname = ?' : ''}
			AND rel.relkind = 'r'
		 ORDER BY rel.relname
	  `,
			bindings,
		);

		if (table) return result.rows[0];
		return result.rows;
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasTable(table: string) {
		const schemaIn = this.explodedSchema.map((schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`);

		const result = await this.knex.raw(
			`
		 SELECT
			rel.relname AS name
		 FROM
			pg_class rel
		 WHERE
			rel.relnamespace IN (${schemaIn})
			AND rel.relkind = 'r'
			AND rel.relname = ?
		 ORDER BY rel.relname
	  `,
			[table],
		);

		return result.rows.length > 0;
	}

	// Columns
	// ===============================================================================================

	/**
	 * Get all the available columns in the current schema/database. Can be filtered to a specific table
	 */
	async columns(table?: string) {
		const bindings: any[] = [];
		if (table) bindings.push(table);

		const schemaIn = this.explodedSchema.map((schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`);

		const result = await this.knex.raw(
			`
		 SELECT
			att.attname AS column,
			rel.relname AS table
		 FROM
			pg_attribute att
			LEFT JOIN pg_class rel ON att.attrelid = rel.oid
		 WHERE
			rel.relnamespace IN (${schemaIn})
			${table ? 'AND rel.relname = ?' : ''}
			AND rel.relkind = 'r'
			AND att.attnum > 0
			AND NOT att.attisdropped;
	  `,
			bindings,
		);

		return result.rows;
	}

	/**
	 * Get the column info for all columns, columns in a given table, or a specific column.
	 */
	columnInfo(): Promise<Column[]>;
	columnInfo(table: string): Promise<Column[]>;
	columnInfo(table: string, column: string): Promise<Column>;
	async columnInfo(table?: string, column?: string) {
		const { knex } = this;

		const bindings: any[] = [];
		if (table) bindings.push(table);
		if (column) bindings.push(column);

		const schemaIn = this.explodedSchema.map((schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`);

		const versionResponse = await this.knex.raw(`SHOW server_version`);

		const majorVersion = versionResponse.rows?.[0]?.server_version?.split('.')?.[0] ?? 10;

		let generationSelect = `
		 NULL AS generation_expression,
		 pg_get_expr(ad.adbin, ad.adrelid) AS default_value,
		 FALSE AS is_generated,
	  `;

		if (Number(majorVersion) >= 12) {
			generationSelect = `
			CASE WHEN att.attgenerated = 's' THEN pg_get_expr(ad.adbin, ad.adrelid) ELSE null END AS generation_expression,
			CASE WHEN att.attgenerated = '' THEN pg_get_expr(ad.adbin, ad.adrelid) ELSE null END AS default_value,
			att.attgenerated = 's' AS is_generated,
		 `;
		}

		const [columns, constraints] = await Promise.all([
			knex.raw<{ rows: RawColumn[] }>(
				`
			SELECT
			  att.attname AS name,
			  rel.relname AS table,
			  rel.relnamespace::regnamespace::text as schema,
			  att.atttypid::regtype::text AS data_type,
			  ix_rel.relname as index_name,
			  NOT att.attnotnull AS is_nullable,
			  ${generationSelect}
			  CASE
				 WHEN att.atttypid IN (1042, 1043) THEN (att.atttypmod - 4)::int4
				 WHEN att.atttypid IN (1560, 1562) THEN (att.atttypmod)::int4
				 ELSE NULL
			  END AS max_length,
			  des.description AS comment,
			  CASE att.atttypid
				 WHEN 21 THEN 16
				 WHEN 23 THEN 32
				 WHEN 20 THEN 64
				 WHEN 1700 THEN
					CASE WHEN atttypmod = -1 THEN NULL
					  ELSE (((atttypmod - 4) >> 16) & 65535)::int4
					END
				 WHEN 700 THEN 24
				 WHEN 701 THEN 53
				 ELSE NULL
			  END AS numeric_precision,
			  CASE
				 WHEN atttypid IN (21, 23, 20) THEN 0
				 WHEN atttypid = 1700 THEN
					CASE
					  WHEN atttypmod = -1 THEN NULL
					  ELSE ((atttypmod - 4) & 65535)::int4
					END
				 ELSE null
			  END AS numeric_scale
			FROM
			  pg_attribute att
			  LEFT JOIN pg_class rel ON att.attrelid = rel.oid
			  LEFT JOIN pg_attrdef ad ON (att.attrelid, att.attnum) = (ad.adrelid, ad.adnum)
			  LEFT JOIN pg_description des ON (att.attrelid, att.attnum) = (des.objoid, des.objsubid)
			  LEFT JOIN LATERAL (
			    SELECT
				 indexrelid
			    FROM
				 pg_index ix
			    WHERE
				 att.attrelid = ix.indrelid
				 AND att.attnum = ALL(ix.indkey)
				 AND ix.indisunique = false
			    LIMIT 1
			  ) ix ON true
			  LEFT JOIN pg_class ix_rel ON ix_rel.oid=ix.indexrelid
			WHERE
			  rel.relnamespace IN (${schemaIn})
			  ${table ? 'AND rel.relname = ?' : ''}
			  ${column ? 'AND att.attname = ?' : ''}
			  AND rel.relkind = 'r'
			  AND att.attnum > 0
			  AND NOT att.attisdropped
			ORDER BY rel.relname, att.attnum;
		 `,
				bindings,
			),
			knex.raw<{ rows: Constraint[] }>(
				`
			SELECT
			  con.contype AS type,
			  rel.relname AS table,
			  att.attname AS column,
			  frel.relnamespace::regnamespace::text AS foreign_key_schema,
			  frel.relname AS foreign_key_table,
			  fatt.attname AS foreign_key_column,
			  CASE
				 WHEN con.contype = 'p' THEN pg_get_serial_sequence(att.attrelid::regclass::text, att.attname) != ''
				 ELSE NULL
			  END AS has_auto_increment
			FROM
			  pg_constraint con
			LEFT JOIN pg_class rel ON con.conrelid = rel.oid
			LEFT JOIN pg_class frel ON con.confrelid = frel.oid
			LEFT JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
			LEFT JOIN pg_attribute fatt ON fatt.attrelid = con.confrelid AND fatt.attnum = con.confkey[1]
			WHERE con.connamespace IN (${schemaIn})
			  AND array_length(con.conkey, 1) <= 1
			  AND (con.confkey IS NULL OR array_length(con.confkey, 1) = 1)
			  ${table ? 'AND rel.relname = ?' : ''}
			  ${column ? 'AND att.attname = ?' : ''}
			`,
				bindings,
			),
		]);

		const parsedColumns: Column[] = columns.rows.map((col): Column => {
			const constraintsForColumn = constraints.rows.filter(
				(constraint) => constraint.table === col.table && constraint.column === col.name,
			);

			const foreignKeyConstraint = constraintsForColumn.find((constraint) => constraint.type === 'f');

			return {
				name: col.name,
				table: col.table,
				data_type: col.data_type,
				default_value: parseDefaultValue(col.default_value),
				generation_expression: col.generation_expression,
				max_length: col.max_length,
				numeric_precision: col.numeric_precision,
				numeric_scale: col.numeric_scale,
				is_generated: col.is_generated,
				is_nullable: col.is_nullable,
				is_unique: constraintsForColumn.some((constraint) => ['u', 'p'].includes(constraint.type)),
				is_indexed: !!col.index_name && col.index_name.length > 0,
				is_primary_key: constraintsForColumn.some((constraint) => constraint.type === 'p'),
				has_auto_increment: constraintsForColumn.some((constraint) => constraint.has_auto_increment),
				foreign_key_schema: foreignKeyConstraint?.foreign_key_schema ?? null,
				foreign_key_table: foreignKeyConstraint?.foreign_key_table ?? null,
				foreign_key_column: foreignKeyConstraint?.foreign_key_column ?? null,
				comment: col.comment,
			};
		});

		if (table && column) return parsedColumns[0];

		const hasPostGIS =
			(await this.knex.raw(`SELECT oid FROM pg_proc WHERE proname = 'postgis_version'`)).rows.length > 0;

		if (!hasPostGIS) {
			return parsedColumns;
		}

		for (const column of parsedColumns) {
			if (['point', 'polygon'].includes(column.data_type)) {
				column.data_type = 'unknown';
			}
		}

		const query = this.knex
			.with(
				'geometries',
				this.knex.raw(`
				select * from geometry_columns
				union
				select * from geography_columns
		`),
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
			const parsedColumn = parsedColumns[0]!;
			const geometry = await query.andWhere('f_geometry_column', column).first();

			if (geometry) {
				parsedColumn.data_type = geometry.data_type;
			}
		}

		const geometries = await query;

		for (const column of parsedColumns) {
			const geometry = geometries.find((geometry) => {
				return column.name == geometry.name && column.table == geometry.table;
			});

			if (geometry) {
				column.data_type = geometry.data_type;
			}
		}

		if (table && column) return parsedColumns[0];
		return parsedColumns;
	}

	/**
	 * Check if the given table contains the given column
	 */
	async hasColumn(table: string, column: string) {
		const schemaIn = this.explodedSchema.map((schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`);

		const result = await this.knex.raw(
			`
		 SELECT
			att.attname AS column,
			rel.relname AS table
		 FROM
			pg_attribute att
			LEFT JOIN pg_class rel ON att.attrelid = rel.oid
		 WHERE
			rel.relnamespace IN (${schemaIn})
			AND rel.relname = ?
			AND att.attname = ?
			AND rel.relkind = 'r'
			AND att.attnum > 0
			AND NOT att.attisdropped;
	  `,
			[table, column],
		);

		return result.rows;
	}

	/**
	 * Get the primary key column for the given table
	 */
	async primary(table: string): Promise<string | null> {
		const schemaIn = this.explodedSchema.map((schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`);

		const result = await this.knex.raw(
			`
		 SELECT
			  att.attname AS column
			FROM
			  pg_constraint con
			LEFT JOIN pg_class rel ON con.conrelid = rel.oid
			LEFT JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
			WHERE con.connamespace IN (${schemaIn})
			  AND con.contype = 'p'
			  AND array_length(con.conkey, 1) <= 1
			  AND rel.relname = ?
	  `,
			[table],
		);

		return result.rows?.[0]?.column ?? null;
	}

	// Foreign Keys
	// ===============================================================================================

	async foreignKeys(table?: string) {
		const schemaIn = this.explodedSchema.map((schemaName) => `${this.knex.raw('?', [schemaName])}::regnamespace`);

		const bindings: any[] = [];
		if (table) bindings.push(table);

		const result = await this.knex.raw(
			`
		  SELECT
			  con.conname AS constraint_name,
			  rel.relname AS table,
			  att.attname AS column,
			  frel.relnamespace::regnamespace::text AS foreign_key_schema,
			  frel.relname AS foreign_key_table,
			  fatt.attname AS foreign_key_column,
			  CASE con.confupdtype
				 WHEN 'r' THEN
					'RESTRICT'
				 WHEN 'c' THEN
					'CASCADE'
				 WHEN 'n' THEN
					'SET NULL'
				 WHEN 'd' THEN
					'SET DEFAULT'
				 WHEN 'a' THEN
					'NO ACTION'
				 ELSE
					NULL
			  END AS on_update,
			  CASE con.confdeltype
				 WHEN 'r' THEN
					'RESTRICT'
				 WHEN 'c' THEN
					'CASCADE'
				 WHEN 'n' THEN
					'SET NULL'
				 WHEN 'd' THEN
					'SET DEFAULT'
				 WHEN 'a' THEN
					'NO ACTION'
				 ELSE
					NULL
			  END AS on_delete
			FROM
			  pg_constraint con
			LEFT JOIN pg_class rel ON con.conrelid = rel.oid
			LEFT JOIN pg_class frel ON con.confrelid = frel.oid
			LEFT JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = con.conkey[1]
			LEFT JOIN pg_attribute fatt ON fatt.attrelid = con.confrelid AND fatt.attnum = con.confkey[1]
			WHERE con.connamespace IN (${schemaIn})
			  AND array_length(con.conkey, 1) <= 1
			  AND (con.confkey IS NULL OR array_length(con.confkey, 1) = 1)
			  AND con.contype = 'f'
			  ${table ? 'AND rel.relname = ?' : ''}
	  `,
			bindings,
		);

		return result.rows;
	}
}
