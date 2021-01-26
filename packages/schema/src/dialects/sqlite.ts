import Knex from 'knex';
import { flatten } from 'lodash';
import { Schema } from '../types/schema';
import { Table } from '../types/table';
import { Column } from '../types/column';
import extractMaxLength from '../utils/extract-max-length';
import { SchemaOverview } from '../types/overview';

type RawColumn = {
	cid: number;
	name: string;
	type: string;
	notnull: 0 | 1;
	dflt_value: any;
	pk: 0 | 1;
};

export default class SQLite implements Schema {
	knex: Knex;

	constructor(knex: Knex) {
		this.knex = knex;
	}

	// Overview
	// ===============================================================================================
	async overview() {
		const tablesWithAutoIncrementPrimaryKeys = (
			await this.knex
				.select('name')
				.from('sqlite_master')
				.whereRaw(`sql LIKE "%AUTOINCREMENT%"`)
		).map(({ name }) => name);

		const tables = await this.tables();
		const overview: SchemaOverview = {};

		for (const table of tables) {
			const columns = await this.knex.raw<RawColumn[]>(`PRAGMA table_info(??)`, table);

			if (table in overview === false) {
				overview[table] = {
					primary: columns.find((column) => column.pk == 1)?.name!,
					columns: {},
				};
			}

			for (const column of columns) {
				overview[table].columns[column.name] = {
					table_name: table,
					column_name: column.name,
					default_value:
						column.pk === 1 && tablesWithAutoIncrementPrimaryKeys.includes(table)
							? 'AUTO_INCREMENT'
							: column.dflt_value,
					is_nullable: column.notnull == 0,
					data_type: column.type,
					numeric_precision: null,
					numeric_scale: null,
				};
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
		const records = await this.knex
			.select('name')
			.from('sqlite_master')
			.whereRaw(`type = 'table' AND name NOT LIKE 'sqlite_%'`);
		return records.map(({ name }) => name) as string[];
	}

	/**
	 * Get the table info for a given table. If table parameter is undefined, it will return all tables
	 * in the current schema/database
	 */
	tableInfo(): Promise<Table[]>;
	tableInfo(table: string): Promise<Table>;
	async tableInfo(table?: string) {
		const query = this.knex
			.select('name', 'sql')
			.from('sqlite_master')
			.where({ type: 'table' })
			.andWhereRaw(`name NOT LIKE 'sqlite_%'`);

		if (table) {
			query.andWhere({ name: table });
		}

		let records = await query;

		records = records.map((table) => ({
			name: table.name,
			sql: table.sql,
		}));

		if (table) {
			return records[0];
		}

		return records;
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasTable(table: string): Promise<boolean> {
		const results = await this.knex
			.select(1)
			.from('sqlite_master')
			.where({ type: 'table', name: table });
		return results.length > 0;
	}

	// Columns
	// ===============================================================================================

	/**
	 * Get all the available columns in the current schema/database. Can be filtered to a specific table
	 */
	async columns(table?: string): Promise<{ table: string; column: string }[]> {
		if (table) {
			const columns = await this.knex.raw<RawColumn[]>(`PRAGMA table_info(??)`, table);
			return columns.map((column) => ({ table, column: column.name }));
		}

		const tables = await this.tables();
		const columnsPerTable = await Promise.all(
			tables.map(async (table) => await this.columns(table))
		);
		return flatten(columnsPerTable);
	}

	/**
	 * Get the column info for all columns, columns in a given table, or a specific column.
	 */
	columnInfo(): Promise<Column[]>;
	columnInfo(table: string): Promise<Column[]>;
	columnInfo(table: string, column: string): Promise<Column>;
	async columnInfo(table?: string, column?: string) {
		const getColumnsForTable = async (table: string): Promise<Column[]> => {
			const tablesWithAutoIncrementPrimaryKeys = (
				await this.knex
					.select('name')
					.from('sqlite_master')
					.whereRaw(`sql LIKE "%AUTOINCREMENT%"`)
			).map(({ name }) => name);

			const columns: RawColumn[] = await this.knex.raw(`PRAGMA table_info(??)`, table);

			const foreignKeys = await this.knex.raw<{ table: string; from: string; to: string }[]>(
				`PRAGMA foreign_key_list(??)`,
				table
			);

			return columns.map(
				(raw): Column => {
					const foreignKey = foreignKeys.find((fk) => fk.from === raw.name);

					return {
						name: raw.name,
						table: table,
						data_type: raw.type,
						default_value: raw.dflt_value,
						max_length: extractMaxLength(raw.dflt_value),
						/** @NOTE SQLite3 doesn't support precision/scale */
						numeric_precision: null,
						numeric_scale: null,
						is_nullable: raw.notnull === 0,
						is_primary_key: raw.pk === 1,
						has_auto_increment:
							raw.pk === 1 && tablesWithAutoIncrementPrimaryKeys.includes(table),
						foreign_key_column: foreignKey?.to || null,
						foreign_key_table: foreignKey?.table || null,
					};
				}
			);
		};

		if (!table) {
			const tables = await this.tables();
			const columnsPerTable = await Promise.all(
				tables.map(async (table) => await getColumnsForTable(table))
			);
			return flatten(columnsPerTable);
		}

		if (table && !column) {
			return await getColumnsForTable(table);
		}

		const columns = await getColumnsForTable(table);
		return columns.find((columnInfo) => columnInfo.name === column);
	}

	/**
	 * Check if a table exists in the current schema/database
	 */
	async hasColumn(table: string, column: string): Promise<boolean> {
		let isColumn = false;
		const results = await this.knex.raw(
			`SELECT COUNT(*) AS ct FROM pragma_table_info('${table}') WHERE name='${column}'`
		);
		const resultsVal = results[0]['ct'];
		if (resultsVal !== 0) {
			isColumn = true;
		}
		return isColumn;
	}

	/**
	 * Get the primary key column for the given table
	 */
	async primary(table: string): Promise<string> {
		const columns = await this.knex.raw<RawColumn[]>(`PRAGMA table_info(??)`, table);
		const pkColumn = columns.find((col) => col.pk !== 0);
		return pkColumn!.name;
	}
}
