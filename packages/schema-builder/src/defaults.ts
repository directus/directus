import type { CollectionOverview, FieldOverview, Relation } from '@directus/types';

export type CollectionDefaults = Omit<CollectionOverview, 'fields' | 'primary' | 'collection'>;
export type FieldDefaults = Omit<FieldOverview, 'field'>;
export type RelationDefaults = {
	meta: Partial<Relation['meta']>;
	schema: Partial<Relation['schema']>;
};

/*
Note that `dbType` varies across databases. This is based on Postgres.
*/

export const COLLECTION_DEFAULTS: CollectionDefaults = {
	singleton: false,
	sortField: null,
	note: null,
	accountability: 'all',
};

export const FIELD_DEFAULTS: Omit<FieldDefaults, 'type' | 'dbType'> = {
	defaultValue: null,
	nullable: true,
	generated: false,
	precision: null,
	scale: null,
	special: [],
	note: null,
	validation: null,
	alias: false,
	searchable: true,
};

export const INTEGER_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'integer',
	dbType: 'integer',
};

export const ID_FIELD: FieldDefaults = {
	...INTEGER_FIELD,
	defaultValue: 'AUTO_INCREMENT',
	nullable: false,
};

export const JSON_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'json',
	dbType: 'json',
};

export const DATE_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'date',
	dbType: 'date',
};

export const TIME_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'time',
	dbType: 'time without time zone',
};

export const DATE_TIME_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'dateTime',
	dbType: 'timestamp without time zone',
};

export const TIMESTAMP_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'timestamp',
	dbType: 'timestamp with time zone',
};

export const HASH_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'hash',
	dbType: 'character varying',
	special: ['hash'],
};

export const CSV_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'csv',
	dbType: 'text',
	special: ['cast-csv'],
};

export const BIG_INTEGER_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'bigInteger',
	dbType: 'bigint',
};

export const FLOAT_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'float',
	dbType: 'real',
};

export const DECIMAL_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'decimal',
	dbType: 'numeric',
};

export const STRING_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'string',
	dbType: 'character varying',
};

export const UUID_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'uuid',
	dbType: 'uuid',
	special: ['uuid'],
};

export const TEXT_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'text',
	dbType: 'text',
};

export const BOOLEAN_FIELD: FieldDefaults = {
	...FIELD_DEFAULTS,
	type: 'boolean',
	dbType: 'boolean',
	special: ['cast-boolean'],
};

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
