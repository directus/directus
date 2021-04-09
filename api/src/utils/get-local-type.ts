import { FieldMeta, types } from '../types';
import { Column } from 'knex-schema-inspector/dist/types/column';
import { SchemaOverview } from '@directus/schema/dist/types/overview';

/**
 * Typemap graciously provided by @gpetrov
 */
const localTypeMap: Record<string, { type: typeof types[number]; useTimezone?: boolean }> = {
	// Shared
	boolean: { type: 'boolean' },
	tinyint: { type: 'boolean' },
	smallint: { type: 'integer' },
	mediumint: { type: 'integer' },
	int: { type: 'integer' },
	integer: { type: 'integer' },
	serial: { type: 'integer' },
	bigint: { type: 'bigInteger' },
	bigserial: { type: 'bigInteger' },
	clob: { type: 'text' },
	tinytext: { type: 'text' },
	mediumtext: { type: 'text' },
	longtext: { type: 'text' },
	text: { type: 'text' },
	varchar: { type: 'string' },
	longvarchar: { type: 'string' },
	varchar2: { type: 'string' },
	nvarchar: { type: 'string' },
	image: { type: 'binary' },
	ntext: { type: 'text' },
	char: { type: 'string' },
	date: { type: 'date' },
	datetime: { type: 'dateTime' },
	dateTime: { type: 'dateTime' },
	timestamp: { type: 'timestamp' },
	time: { type: 'time' },
	float: { type: 'float' },
	double: { type: 'float' },
	'double precision': { type: 'float' },
	real: { type: 'float' },
	decimal: { type: 'decimal' },
	numeric: { type: 'integer' },

	// MySQL
	string: { type: 'text' },
	year: { type: 'integer' },
	blob: { type: 'binary' },
	mediumblob: { type: 'binary' },

	// MS SQL
	bit: { type: 'boolean' },
	smallmoney: { type: 'float' },
	money: { type: 'float' },
	datetimeoffset: { type: 'dateTime', useTimezone: true },
	datetime2: { type: 'dateTime' },
	smalldatetime: { type: 'dateTime' },
	nchar: { type: 'text' },
	binary: { type: 'binary' },
	varbinary: { type: 'binary' },

	// Postgres
	json: { type: 'json' },
	uuid: { type: 'uuid' },
	int2: { type: 'integer' },
	serial4: { type: 'integer' },
	int4: { type: 'integer' },
	serial8: { type: 'integer' },
	int8: { type: 'integer' },
	bool: { type: 'boolean' },
	'character varying': { type: 'string' },
	character: { type: 'string' },
	interval: { type: 'string' },
	_varchar: { type: 'string' },
	bpchar: { type: 'string' },
	timestamptz: { type: 'timestamp' },
	'timestamp with time zone': { type: 'timestamp', useTimezone: true },
	'timestamp without time zone': { type: 'dateTime' },
	timetz: { type: 'time' },
	'time with time zone': { type: 'time', useTimezone: true },
	'time without time zone': { type: 'time' },
	float4: { type: 'float' },
	float8: { type: 'float' },
};

export default function getLocalType(
	column: SchemaOverview[string]['columns'][string] | Column,
	field?: { special?: FieldMeta['special'] }
): typeof types[number] | 'unknown' {
	const type = localTypeMap[column.data_type.toLowerCase().split('(')[0]];

	/** Handle Postgres numeric decimals */
	if (column.data_type === 'numeric' && column.numeric_precision !== null && column.numeric_scale !== null) {
		return 'decimal';
	}

	if (field?.special?.includes('json')) return 'json';
	if (field?.special?.includes('hash')) return 'hash';
	if (field?.special?.includes('csv')) return 'csv';
	if (field?.special?.includes('uuid')) return 'uuid';

	if (type) {
		return type.type;
	}

	return 'unknown';
}
