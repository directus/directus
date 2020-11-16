import Knex from 'knex';
import { Schema } from '../types/schema';
import { Table } from '../types/table';
import { Column } from '../types/column';
import { SchemaOverview } from '../types/overview';

type RawTable = {
	TABLE_NAME: string;
	SCHEMA_NAME: string;
};

type RawColumn = {
	TABLE_NAME: string;
	COLUMN_NAME: string;
	DATA_DEFAULT: any | null;
	DATA_TYPE: string;
	DATA_LENGTH: number | null;
	DATA_PRECISION: number | null;
	DATA_SCALE: number | null;
	NULLABLE: 'YES' | 'NO';
	COLUMN_COMMENT: string | null;
	REFERENCED_TABLE_NAME: string | null;
	REFERENCED_COLUMN_NAME: string | null;
	UPDATE_RULE: string | null;
	DELETE_RULE: string | null;

	/** @TODO Extend with other possible values */
	COLUMN_KEY: 'PRI' | null;
	CONTRAINT_NAME: string | null;
	CONSTRAINT_TYPE: 'P' | null;
};

export default class oracleDB implements Schema {
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
			c.DATA_DEFAULT as default_value,
			c.NULLABLE as is_nullable,
			c.DATA_TYPE as data_type,
			pk.CONSTRAINT_TYPE as column_key
		FROM DBA_TAB_COLUMNS as c
		LEFT JOIN all_constraints as pk
			ON c.TABLE_NAME = pk.TABLE_NAME
			AND c.CONSTRAINT_NAME = pk.CONSTRAINT_NAME
			AND c.OWNER = pk.OWNER
		`
		);

		const overview: SchemaOverview = {};

		for (const column of columns[0]) {
			if (column.table_name in overview === false) {
				overview[column.table_name] = {
					primary: columns[0].find(
						(nested: { column_key: string; table_name: string }) => {
							return (
								nested.table_name === column.table_name && nested.column_key === 'P'
							);
						}
					)?.column_name,
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
			.from('DBA_TABLES');
		return records.map(({ TABLE_NAME }) => TABLE_NAME);
	}

	/**
	 * Get the table info for a given table. If table parameter is undefined, it will return all tables
	 * in the current schema/database
	 */
	tableInfo(): Promise<Table[]>;
	tableInfo(table: string): Promise<Table>;
	async tableInfo<T>(table?: string) {
		const query = this.knex.select('TABLE_NAME', 'OWNER').from('DBA_TABLES');

		if (table) {
			const rawTable: RawTable = await query.andWhere({ TABLE_NAME: table }).first();

			return {
				name: rawTable.TABLE_NAME,
				schema: rawTable.SCHEMA_NAME,
			} as T extends string ? Table : Table[];
		}

		const records: RawTable[] = await query;

		return records.map(
			(rawTable): Table => {
				return {
					name: rawTable.TABLE_NAME,
					schema: rawTable.SCHEMA_NAME,
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
			.from('DBA_TABLES')
			.where({ TABLE_NAME: table })
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
			.from('DBA_TAB_COLUMNS');

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
		const query = this.knex
			.select(
				'c.TABLE_NAME',
				'c.COLUMN_NAME',
				'c.DATA_DEFAULT',
				'c.DATA_TYPE',
				'c.DATA_LENGTH',
				'c.DATA_PRECISION',
				'c.DATA_SCALE',
				'c.NULLABLE',
				'pk.CONSTRAINT_NAME',
				'pk.CONSTRAINT_TYPE',
				'cm.COMMENTS AS COLUMN_COMMENT',
				'fk.TABLE_NAME as REFERENCE_TABLE_NAME',
				'fk.COLUMN_NAME as REFERENCED_COLUMN_NAME',
				'rc.DELETE_RULE',
				'rc.SEARCH_CONDITION'
			)
			.from('DBA_TAB_COLUMNS as c')
			.leftJoin('DBA_COL_COMMENTS as cm', function () {
				this.on('c.TABLE_NAME', '=', 'cm.TABLE_NAME')
					.andOn('cm.COLUMN_NAME', '=', 'c.COLUMN_NAME')
					.andOn('cm.OWNER', '=', 'c.OWNER');
			})
			.leftJoin('all_constraints  as pk', function () {
				this.on('c.TABLE_NAME', '=', 'pk.TABLE_NAME')
					.andOn('c.CONSTRAINT_NAME', '=', 'pk.CONSTRAINT_NAME')
					.andOn('c.OWNER', '=', 'pk.OWNER');
			})
			.where({ 'pk.CONSTRAINT_TYPE': 'P' })
			.leftJoin('all_constraints  as fk', function () {
				this.on('c.TABLE_NAME', '=', 'fk.TABLE_NAME')
					.andOn('c.CONSTRAINT_NAME', '=', 'fk.CONSTRAINT_NAME')
					.andOn('c.OWNER', '=', 'fk.OWNER');
			})
			.where({ 'fk.CONSTRAINT_TYPE': 'R' })
			.leftJoin('all_constraints  as rc', function () {
				this.on('c.TABLE_NAME', '=', 'rc.TABLE_NAME')
					.andOn('c.CONSTRAINT_NAME', '=', 'rc.CONSTRAINT_NAME')
					.andOn('c.OWNER', '=', 'rc.OWNER');
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
				default_value: rawColumn.DATA_DEFAULT,
				max_length: rawColumn.DATA_LENGTH,
				numeric_precision: rawColumn.DATA_PRECISION,
				numeric_scale: rawColumn.DATA_SCALE,
				is_nullable: rawColumn.NULLABLE === 'YES',
				is_primary_key: rawColumn.CONSTRAINT_TYPE === 'P',
				foreign_key_column: rawColumn.REFERENCED_COLUMN_NAME,
				foreign_key_table: rawColumn.REFERENCED_TABLE_NAME,
				comment: rawColumn.COLUMN_COMMENT,
			} as Column;
		}

		const records: RawColumn[] = await query;

		return records.map(
			(rawColumn): Column => {
				return {
					name: rawColumn.COLUMN_NAME,
					table: rawColumn.TABLE_NAME,
					data_type: rawColumn.DATA_TYPE,
					default_value: rawColumn.DATA_DEFAULT,
					max_length: rawColumn.DATA_DEFAULT,
					numeric_precision: rawColumn.DATA_PRECISION,
					numeric_scale: rawColumn.DATA_SCALE,
					is_nullable: rawColumn.NULLABLE === 'YES',
					is_primary_key: rawColumn.CONSTRAINT_TYPE === 'P',
					has_auto_increment: rawColumn.DATA_DEFAULT,
					foreign_key_column: rawColumn.REFERENCED_COLUMN_NAME,
					foreign_key_table: rawColumn.REFERENCED_TABLE_NAME,
					comment: rawColumn.COLUMN_COMMENT,
				};
			}
		) as Column[];
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasColumn(table: string, column: string): Promise<boolean> {
		const { count } = this.knex
			.count<{ count: 0 | 1 }>({ count: '*' })
			.from('DBA_TAB_COLUMNS')
			.where({
				table_schema: this.knex.client.database(),
				table_name: table,
				column_name: column,
			})
			.first();
		return !!count;
	}

	/**
	 * Get the primary key column for the given table
	 */

	async primary(table: string): Promise<string> {
		const { column_name } = await this.knex
			.select('all_constraints.column_name')
			.from('all_constraints')

			.where({
				'all_constraints.CONSTRAINT_TYPE': 'P',
				'all_constraints.TABLE_NAME': table,
			})
			.first();

		return column_name;
	}
}
