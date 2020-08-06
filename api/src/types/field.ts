import { Column } from 'knex-schema-inspector/lib/types/column';

export const types = [
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
] as const;

export type FieldMeta = {
	id: number;
	collection: string;
	field: string;
	special: string | null;
	interface: string | null;
	options: Record<string, any> | null;
	locked: boolean;
	required: boolean;
	readonly: boolean;
	hidden_detail: boolean;
	hidden_browse: boolean;
	sort: number | null;
	width: string | null;
	group: number | null;
	note: string | null;
	translation: null;
};

export type Field = {
	collection: string;
	field: string;
	type: typeof types[number];
	schema: Column;
	meta: FieldMeta | null;
};
