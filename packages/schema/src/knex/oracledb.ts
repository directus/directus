import type { Knex } from 'knex';
import type { SchemaInspector } from '../types/schema-inspector';
import type { Table } from '../types/table';
import type { Column } from '../types/column';
import type { ForeignKey } from '../types/foreign-key';
import { stripQuotes } from '../utils/strip-quotes.js';

/**
 * NOTE: Use previous optimizer for better data dictionary performance.
 */
const OPTIMIZER_FEATURES = '11.2.0.4';

type RawColumn = {
	TABLE_NAME: string;
	COLUMN_NAME: string;
	DATA_DEFAULT: any | null;
	DATA_TYPE: string;
	DATA_LENGTH: number | null;
	DATA_PRECISION: number | null;
	DATA_SCALE: number | null;
	NULLABLE: 'Y' | 'N';
	COLUMN_COMMENT: string | null;
	REFERENCED_TABLE_NAME: string | null;
	REFERENCED_COLUMN_NAME: string | null;
	CONSTRAINT_TYPE: 'P' | 'U' | 'R' | null;
	VIRTUAL_COLUMN: 'YES' | 'NO';
	IDENTITY_COLUMN: 'YES' | 'NO';
};

export function rawColumnToColumn(rawColumn: RawColumn): Column {
	const is_generated = rawColumn.VIRTUAL_COLUMN === 'YES';
	const default_value = parseDefaultValue(rawColumn.DATA_DEFAULT);
	return {
		name: rawColumn.COLUMN_NAME,
		table: rawColumn.TABLE_NAME,
		data_type: rawColumn.DATA_TYPE,
		default_value: !is_generated ? default_value : null,
		generation_expression: is_generated ? default_value : null,
		max_length: rawColumn.DATA_LENGTH,
		numeric_precision: rawColumn.DATA_PRECISION,
		numeric_scale: rawColumn.DATA_SCALE,
		is_generated: rawColumn.VIRTUAL_COLUMN === 'YES',
		is_nullable: rawColumn.NULLABLE === 'Y',
		is_unique: rawColumn.CONSTRAINT_TYPE === 'U',
		is_primary_key: rawColumn.CONSTRAINT_TYPE === 'P',
		has_auto_increment: rawColumn.IDENTITY_COLUMN === 'YES',
		foreign_key_column: rawColumn.REFERENCED_COLUMN_NAME,
		foreign_key_table: rawColumn.REFERENCED_TABLE_NAME,
		comment: rawColumn.COLUMN_COMMENT,
	};
}

export function parseDefaultValue(value: string | null): string | null {
	if (value === null || value.trim().toLowerCase() === 'null') return null;

	return stripQuotes(value);
}

export default class oracleDB implements SchemaInspector {
	knex: Knex;

	constructor(knex: Knex) {
		this.knex = knex;
	}

	// Tables
	// ===============================================================================================

	/**
	 * List all existing tables in the current schema/database
	 */
	async tables(): Promise<string[]> {
		const records = await this.knex
			.select<Table[]>(
				this.knex.raw(`
          /*+ OPTIMIZER_FEATURES_ENABLE('${OPTIMIZER_FEATURES}') */
            "TABLE_NAME" "name"
        `)
			)
			.from('USER_TABLES');
		return records.map(({ name }) => name);
	}

	/**
	 * Get the table info for a given table. If table parameter is undefined, it will return all tables
	 * in the current schema/database
	 */
	tableInfo(): Promise<Table[]>;
	tableInfo(table: string): Promise<Table>;
	async tableInfo(table?: string) {
		const query = this.knex
			.select<Table[]>(
				this.knex.raw(`
          /*+ OPTIMIZER_FEATURES_ENABLE('${OPTIMIZER_FEATURES}') */
            "TABLE_NAME" "name"
        `)
			)
			.from('USER_TABLES');

		if (table) {
			return await query.andWhere({ TABLE_NAME: table }).first();
		}

		return await query;
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasTable(table: string): Promise<boolean> {
		const result = await this.knex
			.select<{ count: 0 | 1 }>(
				this.knex.raw(`
          /*+ OPTIMIZER_FEATURES_ENABLE('${OPTIMIZER_FEATURES}') */
            COUNT(*) "count"
        `)
			)
			.from('USER_TABLES')
			.where({ TABLE_NAME: table })
			.first();
		return !!result?.count;
	}

	// Columns
	// ===============================================================================================

	/**
	 * Get all the available columns in the current schema/database. Can be filtered to a specific table
	 */
	async columns(table?: string) {
		const query = this.knex
			.select<{ table: string; column: string }[]>(
				this.knex.raw(`
          /*+ OPTIMIZER_FEATURES_ENABLE('${OPTIMIZER_FEATURES}') NO_QUERY_TRANSFORMATION */
            "TABLE_NAME" "table",
            "COLUMN_NAME" "column"
        `)
			)
			.from('USER_TAB_COLS')
			.where({ HIDDEN_COLUMN: 'NO' });

		if (table) {
			query.andWhere({ TABLE_NAME: table });
		}

		return await query;
	}

	/**
	 * Get the column info for all columns, columns in a given table, or a specific column.
	 */
	columnInfo(): Promise<Column[]>;
	columnInfo(table: string): Promise<Column[]>;
	columnInfo(table: string, column: string): Promise<Column>;
	async columnInfo(table?: string, column?: string) {
		/**
		 * NOTE: Keep in mind, this query is optimized for speed.
		 */
		const query = this.knex
			.with(
				'uc',
				this.knex.raw(`
          SELECT /*+ MATERIALIZE */
            "uc"."TABLE_NAME",
            "ucc"."COLUMN_NAME",
            "uc"."CONSTRAINT_NAME",
            "uc"."CONSTRAINT_TYPE",
            "uc"."R_CONSTRAINT_NAME",
            COUNT(*) OVER(
              PARTITION BY
                "uc"."CONSTRAINT_NAME"
            ) "CONSTRAINT_COUNT", 
            ROW_NUMBER() OVER(
              PARTITION BY
                "uc"."TABLE_NAME", 
                "ucc"."COLUMN_NAME" 
              ORDER BY 
                "uc"."CONSTRAINT_TYPE"
            ) "CONSTRAINT_PRIORITY"
          FROM "USER_CONSTRAINTS" "uc"
          INNER JOIN "USER_CONS_COLUMNS" "ucc"
            ON "uc"."CONSTRAINT_NAME" = "ucc"."CONSTRAINT_NAME"
          WHERE "uc"."CONSTRAINT_TYPE" IN ('P', 'U', 'R')
      `)
			)
			.select(
				this.knex.raw(`
          /*+ OPTIMIZER_FEATURES_ENABLE('${OPTIMIZER_FEATURES}') */
            "c"."TABLE_NAME", 
            "c"."COLUMN_NAME", 
            "c"."DATA_DEFAULT", 
            "c"."DATA_TYPE", 
            "c"."DATA_LENGTH", 
            "c"."DATA_PRECISION", 
            "c"."DATA_SCALE", 
            "c"."NULLABLE", 
            "c"."IDENTITY_COLUMN", 
            "c"."VIRTUAL_COLUMN", 
            "cm"."COMMENTS" "COLUMN_COMMENT", 
            "ct"."CONSTRAINT_TYPE",
            "fk"."TABLE_NAME" "REFERENCED_TABLE_NAME",
            "fk"."COLUMN_NAME" "REFERENCED_COLUMN_NAME"
          FROM "USER_TAB_COLS" "c" 
          LEFT JOIN "USER_COL_COMMENTS" "cm"
            ON "c"."TABLE_NAME" = "cm"."TABLE_NAME" 
            AND "c"."COLUMN_NAME" = "cm"."COLUMN_NAME" 
          LEFT JOIN "uc" "ct"
            ON "c"."TABLE_NAME" = "ct"."TABLE_NAME" 
            AND "c"."COLUMN_NAME" = "ct"."COLUMN_NAME"
            AND "ct"."CONSTRAINT_COUNT" = 1 
            AND "ct"."CONSTRAINT_PRIORITY" = 1
          LEFT JOIN "uc" "fk"
            ON "ct"."R_CONSTRAINT_NAME" = "fk"."CONSTRAINT_NAME"
        `)
			)
			.where({ 'c.HIDDEN_COLUMN': 'NO' });

		if (table) {
			query.andWhere({ 'c.TABLE_NAME': table });
		}

		if (column) {
			const rawColumn = await query
				.andWhere({
					'c.COLUMN_NAME': column,
				})
				.first();
			return rawColumnToColumn(rawColumn);
		}

		const records: RawColumn[] = await query;

		return records.map(rawColumnToColumn);
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasColumn(table: string, column: string): Promise<boolean> {
		const result = await this.knex
			.select<{ count: 0 | 1 }>(
				this.knex.raw(`
          /*+ OPTIMIZER_FEATURES_ENABLE('${OPTIMIZER_FEATURES}') NO_QUERY_TRANSFORMATION */
            COUNT(*) "count"
        `)
			)
			.from('USER_TAB_COLS')
			.where({
				TABLE_NAME: table,
				COLUMN_NAME: column,
				HIDDEN_COLUMN: 'NO',
			})
			.first();
		return !!result?.count;
	}

	/**
	 * Get the primary key column for the given table
	 */
	async primary(table: string): Promise<string> {
		/**
		 * NOTE: Keep in mind, this query is optimized for speed.
		 */
		const result = await this.knex
			.with(
				'uc',
				this.knex.select(this.knex.raw(`/*+ MATERIALIZE */ "CONSTRAINT_NAME"`)).from('USER_CONSTRAINTS').where({
					TABLE_NAME: table,
					CONSTRAINT_TYPE: 'P',
				})
			)
			.select(
				this.knex.raw(`
          /*+ OPTIMIZER_FEATURES_ENABLE('${OPTIMIZER_FEATURES}') */
            "ucc"."COLUMN_NAME"
          FROM "USER_CONS_COLUMNS" "ucc"
          INNER JOIN "uc" "pk"
            ON "ucc"."CONSTRAINT_NAME" = "pk"."CONSTRAINT_NAME"
        `)
			)
			.first();

		return result?.COLUMN_NAME ?? null;
	}

	// Foreign Keys
	// ===============================================================================================

	async foreignKeys(table?: string): Promise<ForeignKey[]> {
		/**
		 * NOTE: Keep in mind, this query is optimized for speed.
		 */
		const query = this.knex
			.with(
				'ucc',
				this.knex.raw(`
          SELECT /*+ MATERIALIZE */
            "TABLE_NAME",
            "COLUMN_NAME",
            "CONSTRAINT_NAME"
          FROM "USER_CONS_COLUMNS"
        `)
			)
			.select(
				this.knex.raw(`
          /*+ OPTIMIZER_FEATURES_ENABLE('${OPTIMIZER_FEATURES}') */
            "uc"."TABLE_NAME" "table", 
            "fcc"."COLUMN_NAME" "column", 
            "rcc"."TABLE_NAME" AS "foreign_key_table",
            "rcc"."COLUMN_NAME" AS "foreign_key_column",
            "uc"."CONSTRAINT_NAME" "constraint_name", 
            NULL as "on_update", 
            "uc"."DELETE_RULE" "on_delete" 
          FROM "USER_CONSTRAINTS" "uc" 
          INNER JOIN "ucc" "fcc"
            ON "uc"."CONSTRAINT_NAME" = "fcc"."CONSTRAINT_NAME"
          INNER JOIN "ucc" "rcc"
            ON "uc"."R_CONSTRAINT_NAME" = "rcc"."CONSTRAINT_NAME"
      `)
			)
			.where({ 'uc.CONSTRAINT_TYPE': 'R' });

		if (table) {
			query.andWhere({ 'uc.TABLE_NAME': table });
		}

		return await query;
	}
}
