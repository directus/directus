export interface Column {
	name: string;
	table: string;
	data_type: string;
	default_value: string | number | boolean | null;
	max_length: number | null;
	numeric_precision: number | null;
	numeric_scale: number | null;

	is_nullable: boolean;
	is_unique: boolean;
	is_primary_key: boolean;
	is_generated: boolean;
	generation_expression?: string | null;
	has_auto_increment: boolean;
	foreign_key_table: string | null;
	foreign_key_column: string | null;

	// Not supported in SQLite or MSSQL
	comment?: string | null;

	// Postgres Only
	schema?: string;
	foreign_key_schema?: string | null;
}
