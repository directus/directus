import type { Column } from './column.js';
import type { ForeignKey } from './foreign-key.js';
import type { SchemaOverview } from './overview.js';
import type { Table } from './table.js';
import type { Knex } from 'knex';

export interface SchemaInspector {
	knex: Knex;

	overview: () => Promise<SchemaOverview>;

	tables(): Promise<string[]>;

	tableInfo(): Promise<Table[]>;
	tableInfo(table: string): Promise<Table>;

	hasTable(table: string): Promise<boolean>;

	columns(table?: string): Promise<{ table: string; column: string }[]>;

	columnInfo(): Promise<Column[]>;
	columnInfo(table?: string): Promise<Column[]>;
	columnInfo(table: string, column: string): Promise<Column>;

	hasColumn(table: string, column: string): Promise<boolean>;
	primary(table: string): Promise<string | null>;

	foreignKeys(table?: string): Promise<ForeignKey[]>;

	// Not in MySQL
	withSchema?(schema: string): void;
}

export interface SchemaInspectorConstructor {
	new (knex: Knex): SchemaInspector;
}
