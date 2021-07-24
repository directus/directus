import { Column } from 'knex-schema-inspector/dist/types/column';
import { LOCAL_TYPES, TYPES } from '../constants';

type Translations = {
	language: string;
	translation: string;
};

export type Width = 'half' | 'half-left' | 'half-right' | 'full' | 'fill';

export type Type = typeof TYPES[number];

export type LocalType = typeof LOCAL_TYPES[number];

export type FieldMeta = {
	id: number;
	collection: string;
	field: string;
	group: number | null;
	hidden: boolean;
	interface: string | null;
	display: string | null;
	options: Record<string, any> | null;
	display_options: Record<string, any> | null;
	readonly: boolean;
	sort: number | null;
	special: string[] | null;
	translations: Translations[] | null;
	width: Width | null;
	note: string | null;
	system?: true;
};

export interface FieldRaw {
	collection: string;
	field: string;
	type: Type;
	schema: Column | null;
	meta: FieldMeta | null;
}

export interface Field extends FieldRaw {
	name: string;
	children?: Field[] | null;
}
