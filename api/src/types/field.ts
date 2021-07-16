import { Column } from 'knex-schema-inspector/dist/types/column';
import { Filter } from './query';

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
] as const;

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
	conditions: Condition[];
};

export type Field = {
	collection: string;
	field: string;
	type: typeof types[number];
	schema: Column | null;
	meta: FieldMeta | null;
};

export type Condition = {
	name: string;
	rule: Filter;
	overrides: {
		readonly?: boolean;
		hidden?: boolean;
		options?: Record<string, any>;
	};
};
