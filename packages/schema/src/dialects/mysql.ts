import Knex from 'knex';
import { Schema } from '../types/schema';
import { Table } from '../types/table';
import { Column } from '../types/column';
import { SchemaOverview } from '../types/overview';

type RawTable = {
	TABLE_NAME: string;
	TABLE_SCHEMA: string;
	TABLE_COMMENT: string | null;
	ENGINE: string;
	TABLE_COLLATION: string;
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
	COLUMN_COMMENT: string | null;
	REFERENCED_TABLE_NAME: string | null;
	REFERENCED_COLUMN_NAME: string | null;
	UPDATE_RULE: string | null;
	DELETE_RULE: string | null;

	/** @TODO Extend with other possible values */
	COLUMN_KEY: 'PRI' | null;
	EXTRA: 'auto_increment' | null;
	CONSTRAINT_NAME: 'PRIMARY' | null;
};

export default class MySQL implements Schema {
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
			TABLE_NAME as table_name,
			COLUMN_NAME as column_name,
			COLUMN_DEFAULT as default_value,
			IS_NULLABLE as is_nullable,
			DATA_TYPE as data_type,
			COLUMN_KEY as column_key,
			EXTRA as extra
		FROM
			INFORMATION_SCHEMA.COLUMNS
		WHERE
			table_schema = ?;
		`,
			[this.knex.client.database()]
		);

		const overview: SchemaOverview = {};

		for (const column of columns[0]) {
			if (column.table_name in overview === false) {
				overview[column.table_name] = {
					primary: columns[0].find((nested: { column_key: string; table_name: string }) => {
						return nested.table_name === column.table_name && nested.column_key === 'PRI';
					})?.column_name,
					columns: {},
				};
			}

			overview[column.table_name].columns[column.column_name] = {
				...column,
				default_value: column.extra === 'auto_increment' ? 'AUTO_INCREMENT' : column.default_value,
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
				TABLE_SCHEMA: this.knex.client.database(),
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
			.select('TABLE_NAME', 'ENGINE', 'TABLE_SCHEMA', 'TABLE_COLLATION', 'TABLE_COMMENT')
			.from('information_schema.tables')
			.where({
				table_schema: this.knex.client.database(),
				table_type: 'BASE TABLE',
			});

		if (table) {
			const rawTable: RawTable = await query.andWhere({ table_name: table }).first();

			return {
				name: rawTable.TABLE_NAME,
				schema: rawTable.TABLE_SCHEMA,
				comment: rawTable.TABLE_COMMENT,
				collation: rawTable.TABLE_COLLATION,
				engine: rawTable.ENGINE,
			} as T extends string ? Table : Table[];
		}

		const records: RawTable[] = await query;

		return records.map(
			(rawTable): Table => {
				return {
					name: rawTable.TABLE_NAME,
					schema: rawTable.TABLE_SCHEMA,
					comment: rawTable.TABLE_COMMENT,
					collation: rawTable.TABLE_COLLATION,
					engine: rawTable.ENGINE,
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
			.where({ table_schema: this.knex.client.database(), table_name: table })
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
			.where({ TABLE_SCHEMA: this.knex.client.database() });

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
				'c.COLUMN_DEFAULT',
				'c.DATA_TYPE',
				'c.CHARACTER_MAXIMUM_LENGTH',
				'c.IS_NULLABLE',
				'c.COLUMN_KEY',
				'c.EXTRA',
				'c.COLLATION_NAME',
				'c.COLUMN_COMMENT',
				'c.NUMERIC_PRECISION',
				'c.NUMERIC_SCALE',
				'fk.REFERENCED_TABLE_NAME',
				'fk.REFERENCED_COLUMN_NAME',
				'fk.CONSTRAINT_NAME',
				'rc.UPDATE_RULE',
				'rc.DELETE_RULE',
				'rc.MATCH_OPTION'
			)
			.from('INFORMATION_SCHEMA.COLUMNS as c')
			.leftJoin('INFORMATION_SCHEMA.KEY_COLUMN_USAGE as fk', function () {
				this.on('c.TABLE_NAME', '=', 'fk.TABLE_NAME')
					.andOn('fk.COLUMN_NAME', '=', 'c.COLUMN_NAME')
					.andOn('fk.CONSTRAINT_SCHEMA', '=', 'c.TABLE_SCHEMA');
			})
			.leftJoin('INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS as rc', function () {
				this.on('rc.TABLE_NAME', '=', 'fk.TABLE_NAME')
					.andOn('rc.CONSTRAINT_NAME', '=', 'fk.CONSTRAINT_NAME')
					.andOn('rc.CONSTRAINT_SCHEMA', '=', 'fk.CONSTRAINT_SCHEMA');
			})
			.where({
				'c.TABLE_SCHEMA': this.knex.client.database(),
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
				is_primary_key: rawColumn.CONSTRAINT_NAME === 'PRIMARY' || rawColumn.COLUMN_KEY === 'PRI',
				has_auto_increment: rawColumn.EXTRA === 'auto_increment',
				foreign_key_column: rawColumn.REFERENCED_COLUMN_NAME,
				foreign_key_table: rawColumn.REFERENCED_TABLE_NAME,
				comment: rawColumn.COLUMN_COMMENT,
				// onDelete: rawColumn.DELETE_RULE,
				// onUpdate: rawColumn.UPDATE_RULE,
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
					is_primary_key: rawColumn.CONSTRAINT_NAME === 'PRIMARY' || rawColumn.COLUMN_KEY === 'PRI',
					has_auto_increment: rawColumn.EXTRA === 'auto_increment',
					foreign_key_column: rawColumn.REFERENCED_COLUMN_NAME,
					foreign_key_table: rawColumn.REFERENCED_TABLE_NAME,
					comment: rawColumn.COLUMN_COMMENT,
					// onDelete: rawColumn.DELETE_RULE,
					// onUpdate: rawColumn.UPDATE_RULE,
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
		const result = await this.knex
			.count<{ count: 0 | 1 }>('*', { as: 'count' })
			.from('information_schema.columns')
			.where({
				table_schema: this.knex.client.database(),
				table_name: table,
				column_name: column,
			})
			.first();
		return !!(result && result.count);
	}

	/**
	 * Get the primary key column for the given table
	 */
	async primary(table: string) {
		const results = await this.knex.raw(`SHOW KEYS FROM ?? WHERE Key_name = 'PRIMARY'`, table);
		if (results && results.length && results[0].length) {
			return results[0][0]['Column_name'] as string;
		}
		return null;
	}
}
