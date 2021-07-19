import { Column } from 'knex-schema-inspector/dist/types/column';
import { FilterOperator } from './presets';
import { types } from '../constants/field-types';

type Translations = {
	language: string;
	translation: string;
};

export type Width = 'half' | 'half-left' | 'half-right' | 'full' | 'fill';

export type FieldMeta = {
	id: number;
	collection: string;
	field: string;
	group: number | null;
	hidden: boolean;
	interface: string | null;
	display: string | null;
	options: null | Record<string, any>;
	display_options: null | Record<string, any>;
	readonly: boolean;
	sort: number | null;
	special: string[] | null;
	translations: null | Translations[];
	width: Width | null;
	note: string | null;
	conditions: Condition[] | null;
	system?: true;
};

export interface FieldRaw {
	collection: string;
	field: string;
	type: typeof types[number];
	schema: Column | null;
	meta: FieldMeta | null;
}

export interface Field extends FieldRaw {
	name: string;
	children?: Field[] | null;
}

export type ValidationError = {
	code: string;
	field: string;
	type: FilterOperator;
	valid?: number | string | (number | string)[];
	invalid?: number | string | (number | string)[];
	substring?: string;
};

export type Condition = {
	name: string;
	rule: Record<string, any>;

	readonly?: boolean;
	hidden?: boolean;
	options?: Record<string, any>;
};
