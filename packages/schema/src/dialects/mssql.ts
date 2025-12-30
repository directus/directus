import type { Column } from '../types/column.js';
import type { ForeignKey } from '../types/foreign-key.js';
import type { SchemaOverview } from '../types/overview.js';
import type { SchemaInspector } from '../types/schema-inspector.js';
import type { Table } from '../types/table.js';
import { stripQuotes } from '../utils/strip-quotes.js';
import type { Knex } from 'knex';

type RawTable = {
	TABLE_NAME: string;
	TABLE_SCHEMA: string;
	TABLE_CATALOG: string;
};

type RawColumn = {
	table: string;
	name: string;
	data_type: string;
	max_length: number | null;
	numeric_precision: number | null;
	numeric_scale: number | null;
	is_generated: boolean | null;
	is_nullable: 'YES' | 'NO';
	index_name: string | null;
	default_value: string | null;
	is_unique: true | null;
	is_primary_key: true | null;
	has_auto_increment: 'YES' | 'NO';
	foreign_key_table: string | null;
	foreign_key_column: string | null;
	generation_expression: string | null;
};

export function rawColumnToColumn(rawColumn: RawColumn): Column {
	return {
		name: rawColumn.name,
		table: rawColumn.table,
		data_type: rawColumn.data_type,
		default_value: parseDefaultValue(rawColumn.default_value),
		generation_expression: rawColumn.generation_expression || null,
		max_length: parseMaxLength(rawColumn),
		numeric_precision: rawColumn.numeric_precision || null,
		numeric_scale: rawColumn.numeric_scale || null,
		is_generated: !!rawColumn.is_generated,
		is_nullable: rawColumn.is_nullable === 'YES',
		is_unique: rawColumn.is_unique === true,
		is_indexed: !!rawColumn.index_name && rawColumn.index_name.length > 0,
		is_primary_key: rawColumn.is_primary_key === true,
		has_auto_increment: rawColumn.has_auto_increment === 'YES',
		foreign_key_column: rawColumn.foreign_key_column,
		foreign_key_table: rawColumn.foreign_key_table,
	};

	function parseMaxLength(rawColumn: RawColumn) {
		const max_length = Number(rawColumn.max_length);

		if (Number.isNaN(max_length) || rawColumn.max_length === null || rawColumn.max_length === undefined) {
			return null;
		}

		// n-* columns save every character as 2 bytes, which causes the max_length column to return the
		// max length in bytes instead of characters. For example:
		// varchar(100) => max_length == 100
		// nvarchar(100) => max_length == 200
		// In order to get the actual max_length value, we'll divide the value by 2
		// Unless the value is -1, which is the case for n(var)char(MAX)
		if (['nvarchar', 'nchar', 'ntext'].includes(rawColumn.data_type)) {
			return max_length === -1 ? max_length : max_length / 2;
		}

		return max_length;
	}
}

export function parseDefaultValue(value: string | null) {
	if (value === null) return null;

	while (value.startsWith('(') && value.endsWith(')')) {
		value = value.slice(1, -1);
	}

	if (value.trim().toLowerCase() === 'null') return null;

	return stripQuotes(value);
}

export default class MSSQL implements SchemaInspector {
	knex: Knex;
	_schema?: string;

	constructor(knex: Knex) {
		this.knex = knex;
	}

	// MS SQL specific
	// ===============================================================================================

	/**
	 * Set the schema to be used in other methods
	 */
	withSchema(schema: string) {
		this.schema = schema;
		return this;
	}

	get schema() {
		return this._schema || 'dbo';
	}

	set schema(value: string) {
		this._schema = value;
	}

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
				COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsIdentity') as is_identity,
				COLUMNPROPERTY(OBJECT_ID(c.TABLE_SCHEMA + '.' + c.TABLE_NAME), c.COLUMN_NAME, 'IsComputed') as is_generated
			FROM
				[${this.knex.client.database()}].INFORMATION_SCHEMA.COLUMNS as c
			LEFT JOIN (
				SELECT
					PK_SET = CASE WHEN CONSTRAINT_NAME LIKE '%pk%' THEN 'PRIMARY' ELSE NULL END,
					TABLE_NAME,
					CONSTRAINT_CATALOG,
					COLUMN_NAME,
					COUNT(*) OVER (PARTITION BY CONSTRAINT_NAME) as PK_COUNT
				FROM [${this.knex.client.database()}].INFORMATION_SCHEMA.KEY_COLUMN_USAGE
			) as pk
			ON [c].[TABLE_NAME] = [pk].[TABLE_NAME]
			AND [c].[TABLE_CATALOG] = [pk].[CONSTRAINT_CATALOG]
			AND [c].[COLUMN_NAME] = [pk].[COLUMN_NAME]
			AND [pk].[PK_SET] = 'PRIMARY'
			AND [pk].[PK_COUNT] = 1
			INNER JOIN
				[${this.knex.client.database()}].INFORMATION_SCHEMA.TABLES as t
			ON [c].[TABLE_NAME] = [t].[TABLE_NAME]
			AND [c].[TABLE_CATALOG] = [t].[TABLE_CATALOG]
			AND [t].TABLE_TYPE = 'BASE TABLE'
			`,
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

			overview[column.table_name]!.columns[column.column_name] = {
				...column,
				default_value: column.is_identity ? 'AUTO_INCREMENT' : parseDefaultValue(column.default_value),
				is_nullable: column.is_nullable === 'YES',
			};
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
			.select<{ TABLE_NAME: string }[]>('TABLE_NAME')
			.from('INFORMATION_SCHEMA.TABLES')
			.where({
				TABLE_TYPE: 'BASE TABLE',
				TABLE_CATALOG: this.knex.client.database(),
				TABLE_SCHEMA: this.schema,
			});

		return records.map(({ TABLE_NAME }) => TABLE_NAME);
	}

	/**
	 * Get the table info for a given table. If table parameter is undefined, it will return all tables
	 * in the current schema/database
	 */
	tableInfo(): Promise<Table[]>;
	tableInfo(table: string): Promise<Table>;
	async tableInfo<T>(table?: string) {
		const query = this.knex
			.select('TABLE_NAME', 'TABLE_SCHEMA', 'TABLE_CATALOG', 'TABLE_TYPE')
			.from('INFORMATION_SCHEMA.TABLES')
			.where({
				TABLE_CATALOG: this.knex.client.database(),
				TABLE_TYPE: 'BASE TABLE',
				TABLE_SCHEMA: this.schema,
			});

		if (table) {
			const rawTable: RawTable = await query.andWhere({ table_name: table }).first();

			return {
				name: rawTable.TABLE_NAME,
				schema: rawTable.TABLE_SCHEMA,
				catalog: rawTable.TABLE_CATALOG,
			} as T extends string ? Table : Table[];
		}

		const records: RawTable[] = await query;

		return records.map((rawTable): Table => {
			return {
				name: rawTable.TABLE_NAME,
				schema: rawTable.TABLE_SCHEMA,
				catalog: rawTable.TABLE_CATALOG,
			};
		}) as T extends string ? Table : Table[];
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasTable(table: string): Promise<boolean> {
		const result = await this.knex
			.count<{ count: 0 | 1 }>({ count: '*' })
			.from('INFORMATION_SCHEMA.TABLES')
			.where({
				TABLE_CATALOG: this.knex.client.database(),
				table_name: table,
				TABLE_SCHEMA: this.schema,
			})
			.first();

		return (result && result.count === 1) || false;
	}

	// Columns
	// ===============================================================================================

	/**
	 * Get all the available columns in the current schema/database. Can be filtered to a specific table
	 */
	async columns(table?: string) {
		const query = this.knex
			.select<{ TABLE_NAME: string; COLUMN_NAME: string }[]>('TABLE_NAME', 'COLUMN_NAME')
			.from('INFORMATION_SCHEMA.COLUMNS')
			.where({
				TABLE_CATALOG: this.knex.client.database(),
				TABLE_SCHEMA: this.schema,
			});

		if (table) {
			query.andWhere({ TABLE_NAME: table });
		}

		const records = await query;

		return records.map(({ TABLE_NAME, COLUMN_NAME }) => ({
			table: TABLE_NAME,
			column: COLUMN_NAME,
		}));
	}

	/**
	 * Get the column info for all columns, columns in a given table, or a specific column.
	 */
	columnInfo(): Promise<Column[]>;
	columnInfo(table: string): Promise<Column[]>;
	columnInfo(table: string, column: string): Promise<Column>;
	async columnInfo(table?: string, column?: string) {
		const dbName = this.knex.client.database();

		const schemaIdResult = await this.knex.select('schema_id').from('sys.schemas').where({ name: this.schema }).first();

		const schemaId = schemaIdResult.schema_id;

		if (!schemaId) {
			throw new Error(`Schema '${this.schema}' not found.`);
		}

		const dbResult = await this.knex.transaction<RawColumn[] | RawColumn>(async (trx) => {
			await trx.raw(`IF OBJECT_ID('tempdb..##IndexInfo') IS NOT NULL DROP TABLE ##IndexInfo;`);

			await trx.raw(`
			SELECT
				[ic].[object_id],
				[ic].[column_id],
				[ix].[is_unique],
				[ix].[is_primary_key],
				[ix].[name] as index_name,
				MAX([ic].[index_column_id]) OVER (PARTITION BY [ic].[index_id], [ic].[object_id]) AS index_column_count,
				ROW_NUMBER() OVER (
					PARTITION BY [ic].[object_id], [ic].[column_id]
					ORDER BY [ix].[is_primary_key] DESC, [ix].[is_unique] DESC
				) AS index_priority
			INTO ##IndexInfo
			FROM [sys].[index_columns] ic
			JOIN [sys].[indexes] ix ON [ix].[object_id] = [ic].[object_id] AND [ix].[index_id] = [ic].[index_id];`);

			const query = trx
				.with(
					'FilteredIndexInfo',
					this.knex.raw(`
				SELECT
					[object_id],
					[column_id],
					[is_unique],
					[is_primary_key],
					[index_priority],
					[index_name],
					[index_column_count]
				FROM ##IndexInfo
				WHERE ISNULL(index_column_count, 1) = 1 AND ISNULL(index_priority, 1) = 1`),
				)
				.select(
					trx.raw(`
				[o].[name] AS [table],
				[c].[name] AS [name],
				[t].[name] AS [data_type],
				[c].[max_length] AS [max_length],
				[c].[precision] AS [numeric_precision],
				[c].[scale] AS [numeric_scale],
				CASE WHEN [c].[is_nullable] = 0 THEN
					'NO'
				ELSE
					'YES'
				END AS [is_nullable],
				object_definition ([c].[default_object_id]) AS [default_value],
				[i].[is_primary_key],
				[i].[is_unique],
				CASE WHEN [i].[object_id] IS NOT NULL AND [i].[is_unique] = 0 AND [i].[index_name] IS NOT NULL THEN 
					[i].[index_name]
				ELSE
					NULL
				END AS [index_name],
				CASE [c].[is_identity]
					WHEN 1 THEN
						'YES'
					ELSE
						'NO'
				END AS [has_auto_increment],
				OBJECT_NAME ([fk].[referenced_object_id]) AS [foreign_key_table],
				COL_NAME ([fk].[referenced_object_id],
				[fk].[referenced_column_id]) AS [foreign_key_column],
				[cc].[is_computed] as [is_generated],
				[cc].[definition] as [generation_expression]`),
				)
				.from(trx.raw(`??.[sys].[columns] [c]`, [dbName]))
				.joinRaw(`JOIN [sys].[types] [t] ON [c].[user_type_id] = [t].[user_type_id]`)
				.joinRaw(`JOIN [sys].[tables] [o] ON [o].[object_id] = [c].[object_id]`)
				.joinRaw(`JOIN [sys].[schemas] [s] ON [s].[schema_id] = [o].[schema_id]`)
				.joinRaw(
					`LEFT JOIN [sys].[computed_columns] AS [cc] ON [cc].[object_id] = [c].[object_id] AND [cc].[column_id] = [c].[column_id]`,
				)
				.joinRaw(
					`LEFT JOIN [sys].[foreign_key_columns] AS [fk] ON [fk].[parent_object_id] = [c].[object_id] AND [fk].[parent_column_id] = [c].[column_id]`,
				)
				.joinRaw(
					`LEFT JOIN FilteredIndexInfo [i] ON [i].[object_id] = [c].[object_id] AND [i].[column_id] = [c].[column_id]`,
				)
				.where({ 's.schema_id': schemaId });

			if (table) {
				query.andWhere({ 'o.name': table });
			}

			if (column) {
				// if a specific column is requested, return only the first record
				query.andWhere({ 'c.name': column }).first();
			}

			const result = await query;

			await trx.raw(`DROP TABLE ##IndexInfo;`);

			return result;
		});

		if (column) {
			// if a specific column is requested, the db result is a single object
			return rawColumnToColumn(dbResult as RawColumn);
		}

		return (dbResult as RawColumn[]).map(rawColumnToColumn);
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasColumn(table: string, column: string): Promise<boolean> {
		const result = await this.knex
			.count<{ count: 0 | 1 }>({ count: '*' })
			.from('INFORMATION_SCHEMA.COLUMNS')
			.where({
				TABLE_CATALOG: this.knex.client.database(),
				TABLE_NAME: table,
				COLUMN_NAME: column,
				TABLE_SCHEMA: this.schema,
			})
			.first();

		return (result && result.count === 1) || false;
	}

	/**
	 * Get the primary key column for the given table
	 */
	async primary(table: string) {
		const results = await this.knex.raw(
			`SELECT
         Col.Column_Name
       FROM
         INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab,
         INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE Col
       WHERE
         Col.Constraint_Name = Tab.Constraint_Name
         AND Col.Table_Name = Tab.Table_Name
         AND Constraint_Type = 'PRIMARY KEY'
         AND Col.Table_Name = ?
         AND Tab.CONSTRAINT_SCHEMA = ?`,
			[table, this.schema],
		);

		const columnName = results.length > 0 ? results[0]['Column_Name'] : null;
		return columnName as string;
	}

	// Foreign Keys
	// ===============================================================================================

	async foreignKeys(table?: string) {
		const result = await this.knex.raw<ForeignKey[]>(
			`
      SELECT
        OBJECT_NAME (fc.parent_object_id) AS "table",
          COL_NAME (fc.parent_object_id, fc.parent_column_id) AS "column",
          OBJECT_SCHEMA_NAME (f.referenced_object_id) AS foreign_key_schema,
          OBJECT_NAME (f.referenced_object_id) AS foreign_key_table,
          COL_NAME (fc.referenced_object_id, fc.referenced_column_id) AS foreign_key_column,
          f.name AS constraint_name,
          REPLACE(f.update_referential_action_desc, '_', ' ') AS on_update,
          REPLACE(f.delete_referential_action_desc, '_', ' ') AS on_delete
      FROM
        sys.foreign_keys AS f
        INNER JOIN sys.foreign_key_columns AS fc ON f.OBJECT_ID = fc.constraint_object_id
      WHERE
        OBJECT_SCHEMA_NAME (f.parent_object_id) = ?;
    `,
			[this.schema],
		);

		if (table) {
			return result?.filter((row) => row.table === table);
		}

		return result;
	}
}
