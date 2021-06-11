import KnexOracle from 'knex-schema-inspector/dist/dialects/oracledb';
import { Column } from 'knex-schema-inspector/dist/types/column';
import { SchemaOverview } from '../types/overview';
import { SchemaInspector } from '../types/schema';
import { mapKeys } from 'lodash';

export default class Oracle extends KnexOracle implements SchemaInspector {
	private static _mapColumnAutoIncrement(column: Column): Column {
		// Knex doesn't support AUTO_INCREMENT. Assume all numeric primary
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
			MAX_LENGTH: number | null;
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
			max_length: number | null;
		};

		const columns = await this.knex.raw<RawColumn[]>(`
			WITH "uc" AS (
				SELECT /*+ materialize */
					"uc"."TABLE_NAME",
					"ucc"."COLUMN_NAME",
					"uc"."CONSTRAINT_TYPE"
				FROM "USER_CONSTRAINTS" "uc"
				INNER JOIN "USER_CONS_COLUMNS" "ucc" ON "uc"."CONSTRAINT_NAME" = "ucc"."CONSTRAINT_NAME"
				WHERE "uc"."CONSTRAINT_TYPE" = 'P'
			)
			SELECT
				"c"."TABLE_NAME",
				"c"."COLUMN_NAME",
				"c"."DATA_DEFAULT" AS DEFAULT_VALUE,
				"c"."NULLABLE" AS IS_NULLABLE,
				"c"."DATA_TYPE",
				"c"."DATA_PRECISION" AS NUMERIC_PRECISION,
				"c"."DATA_SCALE" AS NUMERIC_SCALE,
				"ct"."CONSTRAINT_TYPE" AS COLUMN_KEY,
				"c"."CHAR_LENGTH" as MAX_LENGTH
			FROM "USER_TAB_COLUMNS" "c"
			LEFT JOIN "uc" "ct" ON "c"."TABLE_NAME" = "ct"."TABLE_NAME"
				AND "c"."COLUMN_NAME" = "ct"."COLUMN_NAME"
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

			// Knex doesn't support AUTO_INCREMENT. Assume all numeric primary
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
