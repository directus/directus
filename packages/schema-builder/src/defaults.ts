import { CollectionOverview, FieldOverview } from '@directus/types';

export type CollectionDefaults = Partial<Omit<CollectionOverview, 'fields'>>;
export type FieldDefaults = Partial<FieldOverview>;

/*
Note that `dbType` varies across databases. This is based on Postgres.
*/

export const COLLECTION_DEFAULTS = {
	singleton: false,
	sortField: null,
	note: null,
	accountability: 'all',
} satisfies CollectionDefaults;

export const FIELD_DEFAULTS = {
	defaultValue: null,
	nullable: true,
	generated: false,
	precision: null,
	scale: null,
	special: [],
	note: null,
	validation: null,
	alias: false,
} satisfies FieldDefaults;

export const RELATION_DEFAULT = {
	...FIELD_DEFAULTS,
	type: 'alias',
	dbType: null,
	alias: true,
} satisfies FieldDefaults;

export const INTEGER_FIELD = {
	...FIELD_DEFAULTS,
	type: 'integer',
	dbType: 'integer',
} satisfies FieldDefaults;

export const ID_FIELD = {
	...INTEGER_FIELD,
	defaultValue: 'AUTO_INCREMENT',
	nullable: false,
} satisfies FieldDefaults;

export const JSON_FIELD = {
	...FIELD_DEFAULTS,
	type: 'json',
	dbType: 'json',
} satisfies FieldDefaults;

export const DATE_FIELD = {
	...FIELD_DEFAULTS,
	type: 'date',
	dbType: 'date',
} satisfies FieldDefaults;

export const TIME_FIELD = {
	...FIELD_DEFAULTS,
	type: 'time',
	dbType: 'time without time zone',
} satisfies FieldDefaults;

export const DATE_TIME_FIELD = {
	...FIELD_DEFAULTS,
	type: 'dateTime',
	dbType: 'timestamp without time zone',
} satisfies FieldDefaults;

export const TIMESTAMP_FIELD = {
	...FIELD_DEFAULTS,
	type: 'timestamp',
	dbType: 'timestamp with time zone',
} satisfies FieldDefaults;

export const HASH_FIELD = {
	...FIELD_DEFAULTS,
	type: 'hash',
	dbType: 'character varying',
	special: ['hash'],
} satisfies FieldDefaults;

export const CSV_FIELD = {
	...FIELD_DEFAULTS,
	type: 'csv',
	dbType: 'text',
	special: ['cast-csv'],
} satisfies FieldDefaults;

export const BIG_INTEGER_FIELD = {
	...FIELD_DEFAULTS,
	type: 'bigInteger',
	dbType: 'bigint',
} satisfies FieldDefaults;

export const FLOAT_FIELD = {
	...FIELD_DEFAULTS,
	type: 'float',
	dbType: 'real',
} satisfies FieldDefaults;

export const DECIMAL_FIELD = {
	...FIELD_DEFAULTS,
	type: 'decimal',
	dbType: 'numeric',
} satisfies FieldDefaults;

export const STRING_FIELD = {
	...FIELD_DEFAULTS,
	type: 'string',
	dbType: 'character varying',
} satisfies FieldDefaults;

export const UUID_FIELD = {
	...FIELD_DEFAULTS,
	type: 'uuid',
	dbType: 'uuid',
	special: ['uuid'],
} satisfies FieldDefaults;

export const TEXT_FIELD = {
	...FIELD_DEFAULTS,
	type: 'text',
	dbType: 'text',
} satisfies FieldDefaults;

export const BOOLEAN_FIELD = {
	...FIELD_DEFAULTS,
	type: 'boolean',
	dbType: 'boolean',
	special: ['cast-boolean'],
} satisfies FieldDefaults;
