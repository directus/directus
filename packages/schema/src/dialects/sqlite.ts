import type { Column } from '../types/column.js';
import type { ForeignKey } from '../types/foreign-key.js';
import type { SchemaOverview } from '../types/overview.js';
import type { SchemaInspector } from '../types/schema-inspector.js';
import type { Table } from '../types/table.js';
import extractMaxLength from '../utils/extract-max-length.js';
import extractType from '../utils/extract-type.js';
import { stripQuotes } from '../utils/strip-quotes.js';
import type { Knex } from 'knex';

type RawForeignKey = {
	id: number;
	seq: number;
	table: string;
	from: string;
	to: string;
	on_update: ForeignKey['on_update'];
	on_delete: ForeignKey['on_delete'];
	match: string;
};

export function parseDefaultValue(value: string | null): string | null {
	if (value === null || value.trim().toLowerCase() === 'null') return null;

	return stripQuotes(value);
}

export default class SQLite implements SchemaInspector {
	knex: Knex;

	constructor(knex: Knex) {
		this.knex = knex;
	}

	// Overview
	// ===============================================================================================

	async overview(): Promise<SchemaOverview> {
		const tablesWithAutoIncrementPrimaryKeys = (
			await this.knex.select('name').from('sqlite_master').whereRaw(`sql LIKE "%AUTOINCREMENT%"`)
		).map(({ name }) => name);

		const tables = await this.tables();
		const overview: SchemaOverview = {};

		for (const table of tables) {
			const columns = await this.knex.raw<RawColumn[]>(`PRAGMA table_xinfo(??)`, table);

			if (table in overview === false) {
				const primaryKeys = columns.filter((column) => column.pk !== 0);

				overview[table] = {
					primary: primaryKeys.length !== 1 ? (undefined as any) : primaryKeys[0]!.name!,
					columns: {},
				};
			}

			for (const column of columns) {
				overview[table]!.columns[column.name] = {
					table_name: table,
					column_name: column.name,
					default_value:
						column.pk === 1 && tablesWithAutoIncrementPrimaryKeys.includes(table)
							? 'AUTO_INCREMENT'
							: parseDefaultValue(column.dflt_value),
					is_nullable: column.notnull == 0,
					is_generated: column.hidden !== 0,
					data_type: extractType(column.type),
					max_length: extractMaxLength(column.type),
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
		const results = await this.knex.select(1).from('sqlite_master').where({ type: 'table', name: table });
		return results.length > 0;
	}

	// Columns
	// ===============================================================================================

	/**
	 * Get all the available columns in the current schema/database. Can be filtered to a specific table
	 */
	async columns(table?: string): Promise<{ table: string; column: string }[]> {
		if (table) {
			const columns = await this.knex.raw<RawColumn[]>(`PRAGMA table_xinfo(??)`, table);
			return columns.map((column) => ({
				table,
				column: column.name,
			}));
		}

		const tables = await this.tables();
		const columnsPerTable = await Promise.all(tables.map(async (table) => await this.columns(table)));
		return columnsPerTable.flat();
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
				await this.knex.select('name').from('sqlite_master').whereRaw(`sql LIKE "%AUTOINCREMENT%"`)
			).map(({ name }) => name);

			const columns: RawColumn[] = await this.knex.raw(`PRAGMA table_xinfo(??)`, table);

			const foreignKeys = await this.knex.raw<{ table: string; from: string; to: string }[]>(
				`PRAGMA foreign_key_list(??)`,
				table,
			);

			const indexList = await this.knex.raw<{ name: string; unique: number }[]>(`PRAGMA index_list(??)`, table);

			const indexInfoList = await Promise.all(
				indexList.map((index) =>
					this.knex.raw<{ seqno: number; cid: number; name: string }[]>(`PRAGMA index_info(??)`, index.name),
				),
			);

			return columns.map((raw): Column => {
				const foreignKey = foreignKeys.find((fk) => fk.from === raw.name);

				let isUniqueColumn = false;
				let isIndexedColumn = false;

				for (let i = 0; i < indexInfoList.length; i++) {
					if (!indexInfoList[i]?.find((fk) => fk.name === raw.name)) {
						continue;
					}

					if (indexInfoList[i]?.length !== 1 || !indexList[i]) {
						continue;
					}

					if (indexList[i]!.unique === 1) {
						isUniqueColumn = true;
					} else if (indexList[i]!.name.length > 0) {
						isIndexedColumn = true;
					}

					if (isUniqueColumn && isIndexedColumn) {
						break;
					}
				}

				return {
					name: raw.name,
					table: table,
					data_type: extractType(raw.type),
					default_value: parseDefaultValue(raw.dflt_value),
					max_length: extractMaxLength(raw.type),
					/** @NOTE SQLite3 doesn't support precision/scale */
					numeric_precision: null,
					numeric_scale: null,
					is_generated: raw.hidden !== 0,
					generation_expression: null,
					is_nullable: raw.notnull === 0,
					is_unique: isUniqueColumn,
					is_indexed: isIndexedColumn,
					is_primary_key: raw.pk === 1,
					has_auto_increment: raw.pk === 1 && tablesWithAutoIncrementPrimaryKeys.includes(table),
					foreign_key_column: foreignKey?.to || null,
					foreign_key_table: foreignKey?.table || null,
				};
			});
		};

		if (!table) {
			const tables = await this.tables();
			const columnsPerTable = await Promise.all(tables.map(async (table) => await getColumnsForTable(table)));
			return columnsPerTable.flat();
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
			`SELECT COUNT(*) AS ct FROM pragma_table_xinfo('${table}') WHERE name='${column}'`,
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
	async primary(table: string) {
		const columns = await this.knex.raw<RawColumn[]>(`PRAGMA table_xinfo(??)`, table);
		const pkColumn = columns.find((col) => col.pk !== 0);
		return pkColumn?.name || null;
	}

	// Foreign Keys
	// ===============================================================================================

	async foreignKeys(table?: string): Promise<ForeignKey[]> {
		if (table) {
			const keys = await this.knex.raw(`PRAGMA foreign_key_list(??)`, table);

			return keys.map(
				(key: RawForeignKey): ForeignKey => ({
					table,
					column: key.from,
					foreign_key_table: key.table,
					foreign_key_column: key.to,
					on_update: key.on_update,
					on_delete: key.on_delete,
					constraint_name: null,
				}),
			);
		}

		const tables = await this.tables();

		const keysPerTable = await Promise.all(tables.map(async (table) => await this.foreignKeys(table)));

		return keysPerTable.flat();
	}
}

type RawColumn = {
	cid: number;
	name: string;
	type: string;
	notnull: 0 | 1;
	hidden: 0 | 1 | 2;
	dflt_value: any;
	pk: 0 | 1;
};
