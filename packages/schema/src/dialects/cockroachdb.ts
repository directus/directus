import type { Knex } from 'knex';
import type { SchemaInspector } from '../types/schema-inspector.js';
import type { Table } from '../types/table.js';
import type { Column } from '../types/column.js';
import type { ForeignKey } from '../types/foreign-key.js';
import { stripQuotes } from '../utils/strip-quotes.js';
import type { SchemaOverview } from '../types/overview.js';

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

	private async resolveTableSchema(table: string): Promise<string> {
		// If you know you only ever introspect the current schema, you can skip this and just use search_path.
		const row = await this.knex
			.select<{ table_schema: string }>('table_schema')
			.from('information_schema.tables')
			.whereIn('table_schema', this.explodedSchema)
			.andWhere({ table_name: table, table_type: 'BASE TABLE' })
			.first();

		return row?.table_schema ?? this.explodedSchema[0]!;
	}

	private qname(schema: string, name: string) {
		// schema-qualified + safely quoted identifier
		// Produces: "schema"."name"
		const s = this.knex.client.wrapIdentifier(schema);
		const n = this.knex.client.wrapIdentifier(name);
		return `${s}.${n}`;
	}

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
		// Cockroach-native list of tables. Faster than pg_catalog.pg_tables. :contentReference[oaicite:5]{index=5}
		const results = await Promise.all(
			this.explodedSchema.map((schema) =>
				this.knex.raw<{ rows: { schema_name: string; table_name: string; type: string }[] }>(
					`SHOW TABLES FROM ${this.qname(this.knex.client.database?.() ?? 'current_database()', schema)}`,
				),
			),
		);

		const tables = results
			.flatMap((r) => r.rows)
			.filter((r) => r.type === 'table')
			.map((r) => r.table_name);

		// de-dupe (in case multiple schemas / search_path overlap)
		return [...new Set(tables)];
	}

	/**
	 * Get the table info for a given table. If table parameter is undefined, it will return all tables
	 * in the current schema/database
	 */
	tableInfo(): Promise<Table[]>;
	tableInfo(table: string): Promise<Table>;
	async tableInfo(table?: string) {
		// Cockroach-native table comments: SHOW TABLES ... WITH COMMENT :contentReference[oaicite:6]{index=6}
		const db = (await this.knex.raw<{ rows: { db: string }[] }>(`SELECT current_database() AS db`)).rows[0]!.db;

		const results = await Promise.all(
			this.explodedSchema.map((schema) =>
				this.knex.raw<{
					rows: { schema_name: string; table_name: string; type: string; comment?: string | null }[];
				}>(`SHOW TABLES FROM ${this.qname(db, schema)} WITH COMMENT`),
			),
		);

		const rows = results.flatMap((r) => r.rows).filter((r) => r.type === 'table');

		if (table) {
			const row = rows.find((r) => r.table_name === table);
			if (!row) return null as any;

			return {
				name: row.table_name,
				schema: row.schema_name,
				comment: row.comment ?? null,
			} as Table;
		}

		return rows
			.sort((a, b) => a.table_name.localeCompare(b.table_name))
			.map((r) => ({
				name: r.table_name,
				schema: r.schema_name,
				comment: r.comment ?? null,
			}));
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
		const db = (await this.knex.raw<{ rows: { db: string }[] }>(`SELECT current_database() AS db`)).rows[0]!.db;

		// Pull constraints once (fast, structured). No pg_catalog.
		const constraints = await this.knex.raw<{
			rows: Array<{
				table_name: string;
				table_schema: string;
				column_name: string;
				constraint_type: 'PRIMARY KEY' | 'UNIQUE' | 'FOREIGN KEY';
				foreign_key_table?: string | null;
				foreign_key_schema?: string | null;
				foreign_key_column?: string | null;
			}>;
		}>(
			`
  WITH
    pk_uq AS (
      SELECT
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        tc.constraint_type,
        NULL::STRING AS foreign_key_schema,
        NULL::STRING AS foreign_key_table,
        NULL::STRING AS foreign_key_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
       AND tc.table_name = kcu.table_name
      WHERE tc.table_schema = ANY(?)
        AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE')
    ),
    fk_single_col AS (
      SELECT
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        'FOREIGN KEY'::STRING AS constraint_type,
        ccu.table_schema AS foreign_key_schema,
        ccu.table_name   AS foreign_key_table,
        ccu.column_name  AS foreign_key_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
       AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
       AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = ANY(?)
        AND tc.constraint_type = 'FOREIGN KEY'
        AND (
          SELECT COUNT(*)
          FROM information_schema.key_column_usage kcu2
          WHERE kcu2.constraint_name = tc.constraint_name
            AND kcu2.table_schema = tc.table_schema
        ) = 1
    )
  SELECT * FROM pk_uq
  UNION ALL
  SELECT * FROM fk_single_col
`,
			[this.explodedSchema, this.explodedSchema],
		);

		const constraintsByKey = new Map<string, typeof constraints.rows>();

		for (const c of constraints.rows) {
			const key = `${c.table_schema}.${c.table_name}.${c.column_name}`;
			const list = constraintsByKey.get(key) ?? [];
			list.push(c);
			constraintsByKey.set(key, list);
		}

		const fetchForOneTable = async (schema: string, t: string) => {
			// SHOW COLUMNS includes indices array, generation_expression, is_hidden and supports WITH COMMENT :contentReference[oaicite:7]{index=7}
			const res = await this.knex.raw<{
				rows: Array<{
					column_name: string;
					data_type: string;
					is_nullable: boolean | string;
					column_default: string | null;
					generation_expression: string | null;
					indices: string[] | null;
					is_hidden: boolean | string;
					comment?: string | null;
				}>;
			}>(`SHOW COLUMNS FROM ${this.qname(schema, t)} WITH COMMENT`);

			return res.rows.map((r): Column => {
				const key = `${schema}.${t}.${r.column_name}`;
				const cons = constraintsByKey.get(key) ?? [];
				const fk = cons.find((x) => x.constraint_type === 'FOREIGN KEY');

				const indices = Array.isArray(r.indices) ? r.indices : [];
				const isPrimary = cons.some((x) => x.constraint_type === 'PRIMARY KEY');
				const isUnique = cons.some((x) => x.constraint_type === 'UNIQUE') || isPrimary;

				const defaultVal = r.column_default ? parseDefaultValue(r.column_default) : null;

				const hasAutoIncrement =
					typeof defaultVal === 'string' &&
					(defaultVal.includes('unique_rowid()') || defaultVal.startsWith('nextval('));

				return {
					table: t,
					name: r.column_name,
					data_type: r.data_type,
					default_value: defaultVal,
					generation_expression: r.generation_expression || null,
					is_generated: !!r.generation_expression,
					is_nullable: r.is_nullable === true || r.is_nullable === 'true',
					is_primary_key: isPrimary,
					is_unique: isUnique,
					is_indexed: indices.length > 0,
					has_auto_increment: hasAutoIncrement,
					foreign_key_schema: fk?.foreign_key_schema ?? null,
					foreign_key_table: fk?.foreign_key_table ?? null,
					foreign_key_column: fk?.foreign_key_column ?? null,
					comment: r.comment ?? null,

					// Keep parity with your existing shape (these weren't in SHOW COLUMNS):
					max_length: null,
					numeric_precision: null,
					numeric_scale: null,
				};
			});
		};

		// If a table was provided, introspect just that table (fast path).
		if (table) {
			const schema = await this.resolveTableSchema(table);
			const cols = await fetchForOneTable(schema, table);

			if (column) {
				const c = cols.find((x) => x.name === column);
				return c as any;
			}

			return cols;
		}

		// Otherwise introspect all tables in the configured schema list.
		// (You can add a concurrency limit here if you have thousands of tables.)
		const tableInfos = (await this.tableInfo()) as Table[];

		const all = await Promise.all(tableInfos.map((t) => fetchForOneTable(t.schema, t.name)));
		const flattened = all.flat();

		if (column) {
			// no table + column is ambiguous; keep prior behavior: return first match
			return flattened.find((c) => c.name === column) as any;
		}

		return flattened;
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
		const bindings: any[] = [this.explodedSchema];
		let tableFilterSql = '';

		if (table) {
			tableFilterSql = 'AND tc.table_name = ?';
			bindings.push(table);
		}

		const result = await this.knex.raw<{ rows: ForeignKey[] }>(
			`
			WITH fk AS (
			SELECT
				tc.table_schema,
				tc.table_name,
				tc.constraint_name,
				rc.update_rule AS on_update,
				rc.delete_rule AS on_delete
			FROM information_schema.table_constraints tc
			JOIN information_schema.referential_constraints rc
				ON rc.constraint_name = tc.constraint_name
			AND rc.constraint_schema = tc.table_schema
			WHERE tc.table_schema = ANY(?)
				AND tc.constraint_type = 'FOREIGN KEY'
				${tableFilterSql}
			),
			src AS (
			SELECT
				kcu.table_schema,
				kcu.table_name,
				kcu.constraint_name,
				STRING_AGG(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS "column"
			FROM information_schema.key_column_usage kcu
			WHERE kcu.table_schema = ANY(?)
			GROUP BY 1,2,3
			),
			ref AS (
			SELECT
				ccu.table_schema AS foreign_key_schema,
				ccu.table_name   AS foreign_key_table,
				ccu.constraint_name,
				STRING_AGG(ccu.column_name, ',' ORDER BY ccu.column_name) AS foreign_key_column
			FROM information_schema.constraint_column_usage ccu
			WHERE ccu.table_schema = ANY(?)
			GROUP BY 1,2,3
			)
			SELECT
			fk.table_name AS "table",
			src."column",
			ref.foreign_key_table,
			ref.foreign_key_column,
			ref.foreign_key_schema,
			fk.constraint_name,
			fk.on_update,
			fk.on_delete
			FROM fk
			JOIN src USING (table_schema, table_name, constraint_name)
			JOIN ref USING (constraint_name)
		`,
			[
				// Note we bind the schema-array three times because we used ANY(?) three times.
				bindings[0],
				bindings[0],
				bindings[0],
				...(table ? [bindings[1]] : []),
			],
		);

		// console.log(result);

		return result.rows;
	}
}
