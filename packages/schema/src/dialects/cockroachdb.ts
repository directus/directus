import type { Knex } from 'knex';
import type { Column } from '../types/column.js';
import type { ForeignKey } from '../types/foreign-key.js';
import type { SchemaOverview } from '../types/overview.js';
import type { SchemaInspector } from '../types/schema-inspector.js';
import type { Table } from '../types/table.js';
import { stripQuotes } from '../utils/strip-quotes.js';

/**
 * Converts CockroachDB default value to JS
 * Eg `'example'::character varying` => `example`
 */
export function parseDefaultValue(value: string | null): string | null {
	if (value === null) return null;
	if (value.startsWith('nextval(')) return value;

	value = value.split('::')[0] ?? null;

	if (value?.trim().toLowerCase() === 'null') return null;

	return stripQuotes(value);
}

export default class CockroachDB implements SchemaInspector {
	knex: Knex;
	schema: string;
	protected explodedSchema: string[];
	protected databaseName: string | undefined;

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

	private async getDatabaseName(): Promise<string> {
		// dont query the database multiple times if we need the db name multiple times
		if (!this.databaseName) {
			const result = await this.knex.raw<{ rows: { db: string }[] }>(`SELECT current_database() AS db`);
			this.databaseName = result.rows[0]!.db;
		}

		return this.databaseName;
	}

	private async resolveTableSchema(table: string): Promise<string> {
		const row = await this.knex
			.select<{ table_schema: string }>('table_schema')
			.from('information_schema.tables')
			.whereIn('table_schema', this.explodedSchema)
			.andWhere({ table_name: table, table_type: 'BASE TABLE' })
			.first();

		return row?.table_schema ?? this.explodedSchema[0]!;
	}

	private sanitizeIdentifier(schema: string, name: string): string {
		const wrappedSchema = this.knex.client.wrapIdentifier(schema);
		const wrapperName = this.knex.client.wrapIdentifier(name);
		return `${wrappedSchema}.${wrapperName}`;
	}

	/**
	 * Set the schema to be used in other methods
	 */
	withSchema(schema: string): this {
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

		const geometryColumns: RawGeometryColumn[] = result.rows ?? [];

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
	async tables(): Promise<string[]> {
		const dbName = await this.getDatabaseName();

		const results = await Promise.all(
			this.explodedSchema.map((schema) =>
				this.knex.raw<{ rows: { schema_name: string; table_name: string; type: string }[] }>(
					`SHOW TABLES FROM ${this.sanitizeIdentifier(dbName, schema)}`,
				),
			),
		);

		const tables = new Set<string>();

		for (const result of results) {
			for (const table of result.rows) {
				if (table.type !== 'table') continue;
				tables.add(table.table_name);
			}
		}

		return Array.from(tables);
	}

	/**
	 * Get the table info for a given table. If table parameter is undefined, it will return all tables
	 * in the current schema/database
	 */
	tableInfo(): Promise<Table[]>;
	tableInfo(table: string): Promise<Table>;
	async tableInfo(table?: string) {
		const dbName = await this.getDatabaseName();

		const results = await Promise.all(
			this.explodedSchema.map((schema) =>
				this.knex.raw<{
					rows: { schema_name: string; table_name: string; type: string; comment?: string | null }[];
				}>(`SHOW TABLES FROM ${this.sanitizeIdentifier(dbName, schema)} WITH COMMENT`),
			),
		);

		const tables = results.flatMap((r) => r.rows).filter((r) => r.type === 'table');

		if (table) {
			const tableInfo = tables.find((r) => r.table_name === table);

			if (!tableInfo) {
				throw new Error(`Table information for "${table}" not found`);
			}

			return {
				name: tableInfo.table_name,
				schema: tableInfo.schema_name,
				comment: tableInfo.comment || null,
			} as Table;
		}

		tables.sort((a, b) => a.table_name.localeCompare(b.table_name));

		return tables.map((r) => {
			return {
				name: r.table_name,
				schema: r.schema_name,
				comment: r.comment || null,
			} as Table;
		});
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasTable(table: string): Promise<boolean> {
		const subquery = this.knex
			.select()
			.from('information_schema.tables')
			.whereIn('table_schema', this.explodedSchema)
			.andWhere({ table_name: table });

		const record = await this.knex.select<{ exists: boolean }>(this.knex.raw('exists (?)', [subquery])).first();
		return Boolean(record?.exists);
	}

	// Columns
	// ===============================================================================================

	private extractColumnTypeMetadata(sqlType: string): {
		max_length: number | null;
		numeric_precision: number | null;
		numeric_scale: number | null;
	} {
		const t = sqlType.trim().toUpperCase();

		const stringMatch = t.match(/^(STRING|VARCHAR|CHAR)\((\d+)\)$/);

		if (stringMatch) {
			return {
				max_length: Number(stringMatch[2]),
				numeric_precision: null,
				numeric_scale: null,
			};
		}

		const decimalMatch = t.match(/^(DECIMAL|NUMERIC)\((\d+)(?:\s*,\s*(\d+))?\)$/);

		if (decimalMatch) {
			return {
				max_length: null,
				numeric_precision: Number(decimalMatch[2]),
				numeric_scale: Number(decimalMatch[3] ?? 0),
			};
		}

		const intPrecisionByType: Record<string, number> = {
			INT2: 16,
			SMALLINT: 16,
			INT4: 32,
			INT: 64,
			INTEGER: 64,
			INT8: 64,
			BIGINT: 64,
		};

		if (typeof intPrecisionByType[t] === 'number') {
			return {
				max_length: null,
				numeric_precision: intPrecisionByType[t],
				numeric_scale: 0,
			};
		}

		return {
			max_length: null,
			numeric_precision: null,
			numeric_scale: null,
		};
	}

	/**
	 * Get all the available columns in the current schema/database. Can be filtered to a specific table
	 */
	async columns(table?: string): Promise<{ table: string; column: string }[]> {
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
			const res = await this.knex.raw<{
				rows: Array<{
					column_name: string;
					data_type: string;
					is_nullable: boolean;
					column_default: string | null;
					generation_expression: string | null;
					column_comment: string | null;
					has_index: boolean;
					has_unique: boolean;
					crdb_sql_type: string;
				}>;
			}>(
				`SELECT
    c.column_name,
    c.data_type,
    BOOL_OR(c.is_nullable = 'YES') as is_nullable,
    c.column_default,
    c.column_comment,
    c.generation_expression,
	c.crdb_sql_type,
    BOOL_OR(s.index_name IS NOT NULL AND s.non_unique = 'YES') AS has_index,
    BOOL_OR(s.index_name IS NOT NULL AND s.non_unique = 'NO') AS has_unique
FROM information_schema.columns c
LEFT JOIN information_schema.statistics s
    ON c.table_schema = s.table_schema
    AND c.table_name = s.table_name
    AND c.column_name = s.column_name
    AND s.implicit = 'NO'
    AND s.storing = 'NO'
WHERE c.table_name = ? AND c.table_schema = ?
GROUP BY
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.column_comment,
    c.generation_expression,
	c.crdb_sql_type,
    c.ordinal_position
ORDER BY c.ordinal_position`,
				[t, schema],
			);

			return res.rows.map((r): Column => {
				const key = `${schema}.${t}.${r.column_name}`;
				const cons = constraintsByKey.get(key) ?? [];
				const fk = cons.find((x) => x.constraint_type === 'FOREIGN KEY');

				const isPrimary = cons.some((x) => x.constraint_type === 'PRIMARY KEY');
				const defaultVal = r.column_default ? parseDefaultValue(r.column_default) : null;

				const hasAutoIncrement =
					typeof defaultVal === 'string' &&
					(defaultVal.includes('unique_rowid()') || defaultVal.startsWith('nextval('));

				// Keep parity with the existing shape (this data isn't in SHOW COLUMNS):
				const typeMetadata = this.extractColumnTypeMetadata(r.crdb_sql_type);

				// Normalize CockroachDB's 64-bit integer type to 'bigint' for consistency
				const normalizedDataType =
					['integer', 'int'].includes(r.data_type.toLowerCase()) && typeMetadata.numeric_precision === 64
						? 'bigint'
						: r.data_type;

				return {
					table: t,
					name: r.column_name,
					data_type: normalizedDataType,
					default_value: defaultVal,
					generation_expression: r.generation_expression || null,
					is_generated: !!r.generation_expression,
					is_nullable: r.is_nullable,
					is_primary_key: isPrimary,
					is_unique: r.has_unique || isPrimary,
					is_indexed: r.has_index,
					has_auto_increment: hasAutoIncrement,
					foreign_key_schema: fk?.foreign_key_schema ?? null,
					foreign_key_table: fk?.foreign_key_table ?? null,
					foreign_key_column: fk?.foreign_key_column ?? null,
					comment: r.column_comment || null,
					...typeMetadata,
				};
			});
		};

		// If a table was provided, introspect just that table
		if (table) {
			const schema = await this.resolveTableSchema(table);
			const cols = await fetchForOneTable(schema, table);

			if (column) {
				const c = cols.find((x) => x.name === column);
				return c as any;
			}

			return cols;
		}

		const tableInfos = await this.tableInfo();
		const all = await Promise.all(tableInfos.map((t) => fetchForOneTable(t.schema!, t.name)));
		const flattened = all.flat();

		if (column) {
			return flattened.find((c) => c.name === column) as any;
		}

		return flattened;
	}

	/**
	 * Check if the given table contains the given column
	 */
	async hasColumn(table: string, column: string): Promise<boolean> {
		const subquery = this.knex
			.select()
			.from('information_schema.columns')
			.whereIn('table_schema', this.explodedSchema)
			.andWhere({
				table_name: table,
				column_name: column,
			});

		const record = await this.knex.select<{ exists: boolean }>(this.knex.raw('exists (?)', [subquery])).first();
		return Boolean(record?.exists);
	}

	/**
	 * Get the primary key column for the given table
	 */
	async primary(table: string): Promise<string | null> {
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

		return result.column_name || null;
	}

	// Foreign Keys
	// ===============================================================================================

	async foreignKeys(table?: string): Promise<ForeignKey[]> {
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
				${table ? 'AND tc.table_name = ?' : ''}
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
				this.explodedSchema,
				this.explodedSchema,
				this.explodedSchema,
				...(table ? [table] : []),
			],
		);

		return result.rows;
	}
}
