import KnexOracle from 'knex-schema-inspector/dist/dialects/oracledb';
import { Column } from 'knex-schema-inspector/dist/types/column';
import { SchemaOverview } from '../types/overview';
import { SchemaInspector } from '../types/schema';
import { mapKeys } from 'lodash';

export default class Oracle extends KnexOracle implements SchemaInspector {
	private static _mapColumnAutoIncrement(column: Column): Column {
		// Oracle doesn't support AUTO_INCREMENT. Assume all numeric primary
		// keys without a default are AUTO_INCREMENT
		const hasAutoIncrement = !column.default_value && column.data_type === 'NUMBER' && column.is_primary_key;

		return {
			...column,
			default_value: hasAutoIncrement ? 'AUTO_INCREMENT' : column.default_value,
			has_auto_increment: hasAutoIncrement,
		};
	}

	columnInfo(): Promise<Column[]>;
	columnInfo(table: string): Promise<Column[]>;
	columnInfo(table: string, column: string): Promise<Column>;
	async columnInfo(table?: string, column?: string): Promise<Column | Column[]> {
		if (column) {
			const columnInfo: Column = await super.columnInfo(table!, column!);
			return Oracle._mapColumnAutoIncrement(columnInfo);
		}

		const columnInfo: Column[] = await super.columnInfo(table!);
		return columnInfo.map(Oracle._mapColumnAutoIncrement);
	}

	async overview(): Promise<SchemaOverview> {
		type RawColumn = {
			TABLE_NAME: string;
			COLUMN_NAME: string;
			DEFAULT_VALUE: string;
			IS_NULLABLE: string;
			DATA_TYPE: string;
			NUMERIC_PRECISION: number | null;
			NUMERIC_SCALE: number | null;
			COLUMN_KEY: string;
		};

		type RawColumnLowercase = {
			table_name: string;
			column_name: string;
			default_value: string;
			is_nullable: string;
			data_type: string;
			numeric_precision: number | null;
			numeric_scale: number | null;
			column_key: string;
		};

		const columns = await this.knex.raw<RawColumn[]>(`
			SELECT
				"USER_TAB_COLUMNS"."TABLE_NAME" AS TABLE_NAME,
				"USER_TAB_COLUMNS"."COLUMN_NAME" AS COLUMN_NAME,
				"USER_TAB_COLUMNS"."DATA_DEFAULT" AS DEFAULT_VALUE,
				"USER_TAB_COLUMNS"."NULLABLE" AS IS_NULLABLE,
				"USER_TAB_COLUMNS"."DATA_TYPE" AS DATA_TYPE,
				"USER_TAB_COLUMNS"."DATA_PRECISION" AS NUMERIC_PRECISION,
				"USER_TAB_COLUMNS"."DATA_SCALE" AS NUMERIC_SCALE,
				"USER_CONSTRAINTS"."CONSTRAINT_TYPE" AS COLUMN_KEY
			FROM
				"USER_TAB_COLUMNS"
				LEFT JOIN "USER_CONS_COLUMNS" ON "USER_TAB_COLUMNS"."TABLE_NAME" = "USER_CONS_COLUMNS"."TABLE_NAME"
					AND "USER_TAB_COLUMNS"."COLUMN_NAME" = "USER_CONS_COLUMNS"."COLUMN_NAME"
				LEFT JOIN "USER_CONSTRAINTS" ON "USER_CONS_COLUMNS"."CONSTRAINT_NAME" = "USER_CONSTRAINTS"."CONSTRAINT_NAME"
		`);

		const columnsLowercase: RawColumnLowercase[] = columns.map(
			(column) => mapKeys(column, (value, key) => key.toLowerCase()) as RawColumnLowercase
		);

		const overview: SchemaOverview = {};

		for (const column of columnsLowercase) {
			if (column.table_name in overview === false) {
				overview[column.table_name] = {
					primary:
						columnsLowercase.find((nested: { column_key: string; table_name: string }) => {
							return nested.table_name === column.table_name && nested.column_key === 'P';
						})?.column_name || 'id',
					columns: {},
				};
			}

			// Oracle doesn't support AUTO_INCREMENT. Assume all numeric primary
			// keys without a default are AUTO_INCREMENT
			const hasAutoIncrement = !column.default_value && column.data_type === 'NUMBER' && column.column_key === 'P';

			overview[column.table_name].columns[column.column_name] = {
				...column,
				is_nullable: column.is_nullable === 'Y',
				default_value: hasAutoIncrement ? 'AUTO_INCREMENT' : column.default_value,
			};
		}

		return overview;
	}
}
