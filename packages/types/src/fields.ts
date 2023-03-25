import type { Column } from '@directus/schema';
import type { FUNCTIONS, GEOMETRY_FORMATS, GEOMETRY_TYPES, LOCAL_TYPES, TYPES } from '@directus/constants';
import type { Filter, FilterOperator } from './filter.js';
import type { DeepPartial } from './misc.js';

type Translations = {
	language: string;
	translation: string;
};

export type Width = 'half' | 'half-left' | 'half-right' | 'full' | 'fill';

export type Type = (typeof TYPES)[number];

export type FieldFunction = (typeof FUNCTIONS)[number];

export type LocalType = (typeof LOCAL_TYPES)[number];

export type GeometryType = (typeof GEOMETRY_TYPES)[number] | 'GeometryCollection' | undefined;

export type GeometryFormat = (typeof GEOMETRY_FORMATS)[number];

export type FieldMeta = {
	id: number;
	collection: string;
	field: string;
	group: string | null;
	hidden: boolean;
	interface: string | null;
	display: string | null;
	options: Record<string, any> | null;
	display_options: Record<string, any> | null;
	readonly: boolean;
	required: boolean;
	sort: number | null;
	special: string[] | null;
	translations: Translations[] | null;
	width: Width | null;
	note: string | null;
	conditions: Condition[] | null;
	validation: Filter | null;
	validation_message: string | null;
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

export type RawField = DeepPartial<Field> & { field: string; type: Type };

export type ValidationError = {
	code: string;
	collection: string;
	field: string;
	type: FilterOperator;
	hidden?: boolean;
	group: string | null;
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
	required?: boolean;
};
