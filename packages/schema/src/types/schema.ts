import Knex from 'knex';
import { Table } from './table';
import { Column } from './column';
import { SchemaOverview } from './overview';

export interface Schema {
	knex: Knex;

	overview(): Promise<SchemaOverview>;

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

	// Not in MySQL
	withSchema?(schema: string): void;
}

export interface SchemaConstructor {
	new (knex: Knex): Schema;
}
