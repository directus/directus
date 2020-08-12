import { TranslateResult } from 'vue-i18n';

type Translation = {
	locale: string;
	translation: string;
};

export type Width = 'half' | 'half-left' | 'half-right' | 'full' | 'fill';

export const types = [
	'alias',
	'bigInteger',
	'boolean',
	'date',
	'dateTime',
	'decimal',
	'float',
	'integer',
	'json',
	'string',
	'text',
	'time',
	'timestamp',
	'binary',
	'uuid',
	'unknown',
] as const;

export type FieldSchema = {
	/** @todo import this from knex-schema-inspector when that's launched */
	name: string;
	table: string;
	type: string;
	default_value: any | null;
	max_length: number | null;
	is_nullable: boolean;
	is_primary_key: boolean;
	has_auto_increment: boolean;
	foreign_key_column: string | null;
	foreign_key_table: string | null;
	comment: string | null;

	// Postgres Only
	schema?: string;
	foreign_key_schema?: string | null;
};

export type FieldMeta = {
	id: number;
	collection: string;
	field: string;
	group: number | null;
	hidden: boolean;
	locked: boolean;
	interface: string | null;
	display: string | null;
	options: null | Record<string, any>;
	display_options: null | Record<string, any>;
	readonly: boolean;
	required: boolean;
	sort: number | null;
	special: string | null;
	translation: null | Translation[];
	width: Width | null;
	note: string | TranslateResult | null;
};

export interface FieldRaw {
	collection: string;
	field: string;
	type: typeof types[number];

	schema: FieldSchema | null;
	meta: FieldMeta | null;
}

export interface Field extends FieldRaw {
	name: string | TranslateResult;
	type: typeof types[number];
	meta: FieldMeta;
}
