// Alias types
export * as SchemaAlias from './alias';

// Integer types
export * as SchemaInteger from './integer';
export * as SchemaBigInteger from './big-integer';
export * as SchemaDecimal from './decimal';
export * as SchemaFloat from './float';

// String types
export * as SchemaString from './string';
export * as SchemaCSV from './csv';
export * as SchemaHash from './hash';
export * as SchemaText from './text';

// DateTime types
export * as SchemaDateTime from './date-time';
export * as SchemaDate from './date';
export * as SchemaTime from './time';
export * as SchemaTimestamp from './timestamp';

// Boolean types
export * as SchemaBoolean from './boolean';

// JSON types
export * as SchemaJSON from './json';

// UUID types
export * as SchemaUUID from './uuid';

export const SchemaAvailableTypes = [
	'alias',
	'bigInteger',
	'boolean',
	'csv',
	'date',
	'datetime',
	'decimal',
	'float',
	'geometry',
	'hash',
	'integer',
	'json',
	'string',
	'text',
	'time',
	'timestamp',
	'uuid',
];

export type GeneratedFilter = {
	operator: string;
	value: any;
	filter: any;
	validatorFunction: (inputValue: any, possibleValues: any) => boolean;
	emptyAllowedFunction: (inputValue: any, possibleValues: any) => boolean;
};
