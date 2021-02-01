import Knex from 'knex';
import { Schema } from '../types/schema';
import { Table } from '../types/table';
import { Column } from '../types/column';
import { SchemaOverview } from '../types/overview';

type RawTable = {
	TABLE_NAME: string;
	TABLE_SCHEMA: string;
	TABLE_CATALOG: string;
};

type RawColumn = {
	TABLE_NAME: string;
	COLUMN_NAME: string;
	COLUMN_DEFAULT: any | null;
	DATA_TYPE: string;
	CHARACTER_MAXIMUM_LENGTH: number | null;
	NUMERIC_PRECISION: number | null;
	NUMERIC_SCALE: number | null;
	IS_NULLABLE: 'YES' | 'NO';
	COLLATION_NAME: string | null;
	CONSTRAINT_TABLE_NAME: string | null;
	CONSTRAINT_COLUMN_NAME: string | null;
	EXTRA: string | null;
	UPDATE_RULE: string | null;
	DELETE_RULE: string | null;

	/** @TODO Extend with other possible values */
	COLUMN_KEY: 'PRI' | null;
	PK_SET: 'PRIMARY' | null;
};

export default class MSSQL implements Schema {
	knex: Knex;

	constructor(knex: Knex) {
		this.knex = knex;
	}

	// Overview
	// ===============================================================================================
	async overview() {
		const columns = await this.knex.raw(
			`
		SELECT
			c.TABLE_NAME as table_name,
			c.COLUMN_NAME as column_name,
			c.COLUMN_DEFAULT as default_value,
			c.IS_NULLABLE as is_nullable,
			c.DATA_TYPE as data_type,
			pk.PK_SET as column_key
		FROM
			[${this.knex.client.database()}].INFORMATION_SCHEMA.COLUMNS as c
		LEFT JOIN (
			SELECT
				PK_SET = CASE WHEN CONSTRAINT_NAME LIKE '%pk%' THEN 'PRIMARY' ELSE NULL END
			FROM [${this.knex.client.database()}].INFORMATION_SCHEMA.KEY_COLUMN_USAGE
		) as pk
		ON [c].[TABLE_NAME] = [pk].[CONSTRAINT_TABLE_NAME]
		AND [c].[TABLE_CATALOG] = [pk].[CONSTRAINT_CATALOG]
		AND [c].[COLUMN_NAME] = [pk].[CONSTRAINT_COLUMN_NAME]
		`
		);

		const overview: SchemaOverview = {};

		for (const column of columns[0]) {
			if (column.table_name in overview === false) {
				overview[column.table_name] = {
					primary: columns[0].find((nested: { column_key: string; table_name: string }) => {
						return nested.table_name === column.table_name && nested.column_key === 'PRIMARY';
					})?.column_name,
					columns: {},
				};
			}

			overview[column.table_name].columns[column.column_name] = {
				...column,
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
			.from('information_schema.tables')
			.where({
				TABLE_CATALOG: this.knex.client.database(),
				TABLE_TYPE: 'BASE TABLE',
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

		return records.map(
			(rawTable): Table => {
				return {
					name: rawTable.TABLE_NAME,
					schema: rawTable.TABLE_SCHEMA,
					catalog: rawTable.TABLE_CATALOG,
				};
			}
		) as T extends string ? Table : Table[];
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasTable(table: string): Promise<boolean> {
		const result = await this.knex
			.count<{ count: 0 | 1 }>({ count: '*' })
			.from('information_schema.tables')
			.where({ TABLE_CATALOG: this.knex.client.database(), table_name: table })
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
			.where({ TABLE_CATALOG: this.knex.client.database() });

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
	async columnInfo<T>(table?: string, column?: string) {
		const dbName = this.knex.client.database();
		const query = this.knex
			.select(
				'c.TABLE_NAME',
				'c.COLUMN_NAME',
				'c.COLUMN_DEFAULT',
				'c.DATA_TYPE',
				'c.CHARACTER_MAXIMUM_LENGTH',
				'c.NUMERIC_PRECISION',
				'c.NUMERIC_SCALE',
				'c.IS_NULLABLE',
				'c.COLLATION_NAME',
				'pk.CONSTRAINT_TABLE_NAME',
				'pk.CONSTRAINT_COLUMN_NAME',
				'pk.CONSTRAINT_NAME',
				'pk.PK_SET',
				'rc.UPDATE_RULE',
				'rc.DELETE_RULE',
				'rc.MATCH_OPTION'
			)
			.from(dbName + '.INFORMATION_SCHEMA.COLUMNS as c')
			.joinRaw(
				`left join (
          select CONSTRAINT_NAME AS CONSTRAINT_NAME, TABLE_NAME as CONSTRAINT_TABLE_NAME, COLUMN_NAME AS CONSTRAINT_COLUMN_NAME, CONSTRAINT_CATALOG, CONSTRAINT_SCHEMA, PK_SET =   CASE
          WHEN CONSTRAINT_NAME  like '%pk%' THEN 'PRIMARY'
        ELSE NULL
       END  from [${dbName}].INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          ) as pk
          ON [c].[TABLE_NAME] = [pk].[CONSTRAINT_TABLE_NAME]
                          AND [c].[TABLE_CATALOG] = [pk].[CONSTRAINT_CATALOG]
                           AND [c].[COLUMN_NAME] = [pk].[CONSTRAINT_COLUMN_NAME]
        `
			)
			.joinRaw(
				`left join (
      select CONSTRAINT_NAME,CONSTRAINT_CATALOG, CONSTRAINT_SCHEMA, MATCH_OPTION, DELETE_RULE, UPDATE_RULE from [${dbName}].INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS

      ) as rc
      ON [pk].[CONSTRAINT_NAME] = [rc].[CONSTRAINT_NAME]
                      AND [pk].[CONSTRAINT_CATALOG] = [rc].[CONSTRAINT_CATALOG]
                       AND [pk].[CONSTRAINT_SCHEMA] = [rc].[CONSTRAINT_SCHEMA]`
			)
			.joinRaw(
				`
           LEFT JOIN
            (SELECT
               COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') as EXTRA,
                TABLE_NAME,
                COLUMN_NAME,
                TABLE_CATALOG
             FROM
              INFORMATION_SCHEMA.COLUMNS
             WHERE
              COLUMNPROPERTY(object_id(TABLE_NAME), COLUMN_NAME, 'IsIdentity') = 1) AS ac
               ON [c].[TABLE_NAME] = [ac].[TABLE_NAME]
                AND [c].[TABLE_CATALOG] = [ac].[TABLE_CATALOG]
                 AND [c].[COLUMN_NAME] = [ac].[COLUMN_NAME]
          `
			)
			.where({
				'c.TABLE_CATALOG': this.knex.client.database(),
			});

		if (table) {
			query.andWhere({ 'c.TABLE_NAME': table });
		}

		if (column) {
			const rawColumn: RawColumn = await query.andWhere({ 'c.column_name': column }).first();

			return {
				name: rawColumn.COLUMN_NAME,
				table: rawColumn.TABLE_NAME,
				data_type: rawColumn.DATA_TYPE,
				default_value: parseDefault(rawColumn.COLUMN_DEFAULT),
				max_length: rawColumn.CHARACTER_MAXIMUM_LENGTH,
				numeric_precision: rawColumn.NUMERIC_PRECISION,
				numeric_scale: rawColumn.NUMERIC_SCALE,
				is_nullable: rawColumn.IS_NULLABLE === 'YES',
				is_primary_key: rawColumn.PK_SET === 'PRIMARY',
				has_auto_increment: rawColumn.EXTRA === '1',
				foreign_key_column: rawColumn.CONSTRAINT_COLUMN_NAME,
				foreign_key_table: rawColumn.CONSTRAINT_TABLE_NAME,
			} as Column;
		}

		const records: RawColumn[] = await query;

		return records.map(
			(rawColumn): Column => {
				return {
					name: rawColumn.COLUMN_NAME,
					table: rawColumn.TABLE_NAME,
					data_type: rawColumn.DATA_TYPE,
					default_value: parseDefault(rawColumn.COLUMN_DEFAULT),
					max_length: rawColumn.CHARACTER_MAXIMUM_LENGTH,
					numeric_precision: rawColumn.NUMERIC_PRECISION,
					numeric_scale: rawColumn.NUMERIC_SCALE,
					is_nullable: rawColumn.IS_NULLABLE === 'YES',
					is_primary_key: rawColumn.PK_SET === 'PRIMARY',
					has_auto_increment: rawColumn.EXTRA === '1',
					foreign_key_column: rawColumn.CONSTRAINT_COLUMN_NAME,
					foreign_key_table: rawColumn.CONSTRAINT_TABLE_NAME,
				};
			}
		) as Column[];

		function parseDefault(value: any) {
			// MariaDB returns string NULL for not-nullable varchar fields
			if (value === 'NULL' || value === 'null') return null;
			return value;
		}
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasColumn(table: string, column: string): Promise<boolean> {
		const { count } = this.knex
			.count<{ count: 0 | 1 }>({ count: '*' })
			.from('information_schema.tables')
			.where({
				TABLE_CATALOG: this.knex.client.database(),
				TABLE_NAME: table,
				COLUMN_NAME: column,
			})
			.first();
		return !!count;
	}

	/**
	 * Get the primary key column for the given table
	 */
	async primary(table: string) {
		const results = await this.knex.raw(
			`SELECT Col.Column_Name from INFORMATION_SCHEMA.TABLE_CONSTRAINTS Tab, INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE Col WHERE Col.Constraint_Name = Tab.Constraint_Name AND Col.Table_Name = Tab.Table_Name AND Constraint_Type = 'PRIMARY KEY' AND Col.Table_Name = '${table}'`
		);
		return results[0]['Column_Name'] as string;
	}
}
