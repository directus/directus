import type { Knex } from 'knex';
import type { Column } from '../types/column.js';
import type { ForeignKey } from '../types/foreign-key.js';
import type { SchemaOverview } from '../types/overview.js';
import type { SchemaInspector } from '../types/schema-inspector.js';
import type { Table } from '../types/table.js';
import { stripQuotes } from '../utils/strip-quotes.js';

type RawTable = {
	table_name: string;
	table_schema: 'public' | string;
	table_comment: string | null;
};

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
 * Converts CockroachDB default value to JS
 * Eg `'example'::character varying` => `example`
 */
export function parseDefaultValue(value: string | null) {
	if (value === null) return null;
	if (value.startsWith('nextval(')) return value;

	value = value.split('::')[0] ?? null;

	if (value?.trim().toLowerCase() === 'null') return null;

	return stripQuotes(value);
}

export default class CockroachDB implements SchemaInspector {
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

	// CockroachDB specific
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
          AND c.table_schema IN (?);
      `,
				[this.explodedSchema.join(',')],
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
          AND nspname IN (?)
          AND pg_class.relnamespace = pg_namespace.oid
          AND pg_attribute.attrelid = pg_class.oid
          AND pg_attribute.attnum = ANY (pg_index.indkey)
          AND indisprimary
          AND indnatts = 1
			 AND relkind != 'S'
      `,
				[this.explodedSchema.join(',')],
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
				WHERE f_table_schema in (?)
				`,
				[this.explodedSchema.join(',')],
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
		const records = await this.knex
			.select<{ tablename: string }[]>('tablename')
			.from('pg_catalog.pg_tables')
			.whereIn('schemaname', this.explodedSchema);

		return records.map(({ tablename }) => tablename);
	}

	/**
	 * Get the table info for a given table. If table parameter is undefined, it will return all tables
	 * in the current schema/database
	 */
	tableInfo(): Promise<Table[]>;
	tableInfo(table: string): Promise<Table>;
	async tableInfo(table?: string) {
		const query = this.knex
			.select(
				'table_name',
				'table_schema',
				this.knex
					.select(this.knex.raw('obj_description(oid)'))
					.from('pg_class')
					.where({ relkind: 'r' })
					.andWhere({ relname: 'table_name' })
					.as('table_comment'),
			)
			.from('information_schema.tables')
			.whereIn('table_schema', this.explodedSchema)
			.andWhereRaw(`"table_catalog" = current_database()`)
			.andWhere({ table_type: 'BASE TABLE' })
			.orderBy('table_name', 'asc');

		if (table) {
			const rawTable: RawTable = await query.andWhere({ table_name: table }).limit(1).first();

			return {
				name: rawTable.table_name,
				schema: rawTable.table_schema,
				comment: rawTable.table_comment,
			} as Table;
		}

		const records = await query;

		return records.map((rawTable: RawTable): Table => {
			return {
				name: rawTable.table_name,
				schema: rawTable.table_schema,
				comment: rawTable.table_comment,
			};
		});
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasTable(table: string) {
		const subquery = this.knex
			.select()
			.from('information_schema.tables')
			.whereIn('table_schema', this.explodedSchema)
			.andWhere({ table_name: table });

		const record = await this.knex.select<{ exists: boolean }>(this.knex.raw('exists (?)', [subquery])).first();
		return record?.exists || false;
	}

	// Columns
	// ===============================================================================================

	/**
	 * Get all the available columns in the current schema/database. Can be filtered to a specific table
	 */
	async columns(table?: string) {
		const query = this.knex
			.select<{ table_name: string; column_name: string }[]>('table_name', 'column_name')
			.from('information_schema.columns')
			.whereIn('table_schema', this.explodedSchema);

		if (table) {
			query.andWhere({ table_name: table });
		}

		const records = await query;

		return records.map(({ table_name, column_name }) => ({
			table: table_name,
			column: column_name,
		}));
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

		const [columns, constraints] = await Promise.all([
			knex.raw<{ rows: RawColumn[] }>(
				`
         SELECT *, CASE WHEN res.is_generated THEN (
          SELECT
            generation_expression
          FROM
            information_schema.columns
          WHERE
            table_schema = res.schema
            AND table_name = res.table
            AND column_name = res.name
          ) ELSE NULL END AS generation_expression
         FROM (
         SELECT
           att.attname AS name,
           rel.relname AS table,
           rel.relnamespace::regnamespace::text AS schema,
           format_type(att.atttypid, null) AS data_type,
           ix_rel.relname as index_name,
           NOT att.attnotnull AS is_nullable,
           CASE WHEN att.attgenerated = '' THEN pg_get_expr(ad.adbin, ad.adrelid) ELSE null END AS default_value,
           att.attgenerated = 's' AS is_generated,
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
         ORDER BY rel.relname, att.attnum) res;
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
           fatt.attname AS foreign_key_column
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
				is_indexed: !!col.index_name?.length && col.index_name.length > 0,
				is_primary_key: constraintsForColumn.some((constraint) => constraint.type === 'p'),
				has_auto_increment:
					['integer', 'bigint'].includes(col.data_type) && (col.default_value?.startsWith('nextval(') ?? false),
				foreign_key_schema: foreignKeyConstraint?.foreign_key_schema ?? null,
				foreign_key_table: foreignKeyConstraint?.foreign_key_table ?? null,
				foreign_key_column: foreignKeyConstraint?.foreign_key_column ?? null,
				comment: col.comment,
			};
		});

		for (const column of parsedColumns) {
			if (['point', 'polygon'].includes(column.data_type)) {
				column.data_type = 'unknown';
			}
		}

		const hasPostGIS =
			(await this.knex.raw(`SELECT oid FROM pg_proc WHERE proname = 'postgis_version'`)).rows.length > 0;

		if (!hasPostGIS) {
			if (table && column) return parsedColumns[0];
			return parsedColumns;
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

			return parsedColumn;
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

		return parsedColumns;
	}

	/**
	 * Check if the given table contains the given column
	 */
	async hasColumn(table: string, column: string) {
		const subquery = this.knex
			.select()
			.from('information_schema.columns')
			.whereIn('table_schema', this.explodedSchema)
			.andWhere({
				table_name: table,
				column_name: column,
			});

		const record = await this.knex.select<{ exists: boolean }>(this.knex.raw('exists (?)', [subquery])).first();
		return record?.exists || false;
	}

	/**
	 * Get the primary key column for the given table
	 */
	async primary(table: string): Promise<string> {
		const result = await this.knex
			.select('information_schema.key_column_usage.column_name')
			.from('information_schema.key_column_usage')
			.leftJoin(
				'information_schema.table_constraints',
				'information_schema.table_constraints.constraint_name',
				'information_schema.key_column_usage.constraint_name',
			)
			.whereIn('information_schema.table_constraints.table_schema', this.explodedSchema)
			.andWhere({
				'information_schema.table_constraints.constraint_type': 'PRIMARY KEY',
				'information_schema.table_constraints.table_name': table,
			})
			.first();

		return result ? result.column_name : null;
	}

	// Foreign Keys
	// ===============================================================================================

	async foreignKeys(table?: string) {
		const result = await this.knex.raw<{ rows: ForeignKey[] }>(`
      SELECT
        c.conrelid::regclass::text AS "table",
        (
          SELECT
            STRING_AGG(a.attname, ','
            ORDER BY
              t.seq)
          FROM (
            SELECT
              ROW_NUMBER() OVER (ROWS UNBOUNDED PRECEDING) AS seq,
              attnum
            FROM
              UNNEST(c.conkey) AS t (attnum)) AS t
          INNER JOIN pg_attribute AS a ON a.attrelid = c.conrelid
            AND a.attnum = t.attnum) AS "column",
        tt.name AS foreign_key_table,
        (
          SELECT
            STRING_AGG(QUOTE_IDENT(a.attname), ','
            ORDER BY
              t.seq)
          FROM (
            SELECT
              ROW_NUMBER() OVER (ROWS UNBOUNDED PRECEDING) AS seq,
              attnum
            FROM
              UNNEST(c.confkey) AS t (attnum)) AS t
        INNER JOIN pg_attribute AS a ON a.attrelid = c.confrelid
          AND a.attnum = t.attnum) AS foreign_key_column,
        tt.schema AS foreign_key_schema,
        c.conname AS constraint_name,
        CASE confupdtype
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
        CASE confdeltype
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
        END AS
        on_delete
      FROM
        pg_catalog.pg_constraint AS c
        INNER JOIN (
          SELECT
            pg_class.oid,
            QUOTE_IDENT(pg_namespace.nspname) AS SCHEMA,
            QUOTE_IDENT(pg_class.relname) AS name
          FROM
            pg_class
            INNER JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid) AS tf ON tf.oid = c.conrelid
        INNER JOIN (
          SELECT
            pg_class.oid,
            QUOTE_IDENT(pg_namespace.nspname) AS SCHEMA,
            QUOTE_IDENT(pg_class.relname) AS name
          FROM
            pg_class
            INNER JOIN pg_namespace ON pg_class.relnamespace = pg_namespace.oid) AS tt ON tt.oid = c.confrelid
      WHERE
        c.contype = 'f';
    `);

		const rowsWithoutQuotes = result.rows.map(stripRowQuotes);

		if (table) {
			return rowsWithoutQuotes.filter((row) => row.table === table);
		}

		return rowsWithoutQuotes;

		function stripRowQuotes(row: ForeignKey): ForeignKey {
			return Object.fromEntries(
				Object.entries(row).map(([key, value]) => {
					return [key, stripQuotes(value)];
				}),
			) as ForeignKey;
		}
	}
}
