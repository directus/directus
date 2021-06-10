import { Column } from 'knex-schema-inspector/dist/types/column';

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
	'hash',
	'csv',
	'geometry',
] as const;
export type DataType = typeof types[number];

export type FieldMeta = {
	id: number;
	collection: string;
	field: string;
	special: string[] | null;
	interface: string | null;
	options: Record<string, any> | null;
	readonly: boolean;
	hidden: boolean;
	sort: number | null;
	width: string | null;
	group: number | null;
	note: string | null;
	translations: null;
};

export type Field = {
	collection: string;
	field: string;
	type: DataType;
	schema: (Column & { geometry_type?: string }) | null;
	meta: FieldMeta | null;
};

export type RawField = DeepPartial<Field> & { field: string; type: typeof types[number] };
