import type { CollectionMeta, Field, FieldMeta, Relation, Type } from '@directus/types';

export type Column = NonNullable<Field['schema']>;
export type ColumnDefaults = Omit<Column, 'name' | 'table'>;
export type CollectionMetaDefaults = Omit<CollectionMeta, 'collection'>;
export type FieldMetaDefaults = Omit<FieldMeta, 'id' | 'collection' | 'field'>;

export type FieldDefaults = {
	type: Type;
	schema: ColumnDefaults | null;
	meta: FieldMetaDefaults;
};

export type RelationDefaults = {
	meta: Partial<Relation['meta']>;
	schema: Partial<Relation['schema']>;
};

/*
Note that `data_type` varies across databases. This is based on Postgres.
*/

export const COLLECTION_META_DEFAULTS: CollectionMetaDefaults = {
	note: null,
	hidden: false,
	singleton: false,
	icon: null,
	color: null,
	translations: null,
	display_template: null,
	preview_url: null,
	versioning: false,
	autosave_revision_interval: null,
	sort_field: null,
	archive_field: null,
	archive_value: null,
	unarchive_value: null,
	archive_app_filter: true,
	item_duplication_fields: null,
	accountability: 'all',
	system: false,
	sort: null,
	group: null,
	collapse: 'open',
	status: 'active',
};

export const FIELD_META_DEFAULTS: FieldMetaDefaults = {
	group: null,
	hidden: false,
	interface: null,
	display: null,
	options: null,
	display_options: null,
	readonly: false,
	required: false,
	sort: null,
	special: null,
	translations: null,
	width: 'full',
	note: null,
	conditions: null,
	validation: null,
	validation_message: null,
	searchable: true,
};

export const COLUMN_DEFAULTS: ColumnDefaults = {
	data_type: 'integer',
	default_value: null,
	max_length: null,
	numeric_precision: null,
	numeric_scale: null,
	is_nullable: true,
	is_unique: false,
	is_indexed: false,
	is_primary_key: false,
	is_generated: false,
	generation_expression: null,
	has_auto_increment: false,
	foreign_key_table: null,
	foreign_key_column: null,
};

function column_field(
	type: Type,
	data_type: string,
	special: string[] = [],
	schema: Partial<ColumnDefaults> = {},
): FieldDefaults {
	return {
		type,
		schema: { ...COLUMN_DEFAULTS, data_type, ...schema },
		meta: { ...FIELD_META_DEFAULTS, special: special.length > 0 ? special : null },
	};
}

export function alias_field(special: string[]): FieldDefaults {
	return {
		type: 'alias',
		schema: null,
		meta: { ...FIELD_META_DEFAULTS, special },
	};
}

export const INTEGER_FIELD: FieldDefaults = column_field('integer', 'integer');
export const ID_FIELD: FieldDefaults = column_field('integer', 'integer', [], {
	is_nullable: false,
	has_auto_increment: true,
});
export const JSON_FIELD: FieldDefaults = column_field('json', 'json');
export const DATE_FIELD: FieldDefaults = column_field('date', 'date');
export const TIME_FIELD: FieldDefaults = column_field('time', 'time without time zone');
export const DATE_TIME_FIELD: FieldDefaults = column_field('dateTime', 'timestamp without time zone');
export const TIMESTAMP_FIELD: FieldDefaults = column_field('timestamp', 'timestamp with time zone');
export const HASH_FIELD: FieldDefaults = column_field('hash', 'character varying', ['hash'], { max_length: 255 });
export const CSV_FIELD: FieldDefaults = column_field('csv', 'text', ['cast-csv']);
export const BIG_INTEGER_FIELD: FieldDefaults = column_field('bigInteger', 'bigint');
export const FLOAT_FIELD: FieldDefaults = column_field('float', 'real', [], { numeric_precision: 24 });
export const DECIMAL_FIELD: FieldDefaults = column_field('decimal', 'numeric');
export const STRING_FIELD: FieldDefaults = column_field('string', 'character varying', [], { max_length: 255 });
export const UUID_FIELD: FieldDefaults = column_field('uuid', 'uuid', ['uuid']);
export const TEXT_FIELD: FieldDefaults = column_field('text', 'text');
export const BOOLEAN_FIELD: FieldDefaults = column_field('boolean', 'boolean', ['cast-boolean']);
export const M2O_FIELD: FieldDefaults = column_field('integer', 'integer', ['m2o']);

export const RELATION_DEFAULTS: RelationDefaults = {
	meta: {
		sort_field: null,
		one_deselect_action: 'nullify',
	},
	schema: {
		foreign_key_schema: 'public',
		on_update: 'NO ACTION',
		on_delete: 'SET NULL',
	},
};
