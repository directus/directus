import { SchemaOverview } from '@directus/schema/dist/types/overview';
import { Column } from 'knex-schema-inspector/dist/types/column';
import { FieldMeta, DataType } from '../types';

/**
 * Typemap graciously provided by @gpetrov
 */
type LocalTypeEntry = {
	type: DataType | 'unknown';
	useTimezone?: boolean;
	geometry_type?: string;
	geometry_format?: string;
};
const localTypeMap: Record<string, LocalTypeEntry> = {
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

	// Geometries
	point: { type: 'geometry', geometry_type: 'Point', geometry_format: 'native' },
	linestring: { type: 'geometry', geometry_type: 'Linestring', geometry_format: 'native' },
	polygon: { type: 'geometry', geometry_type: 'Polygon', geometry_format: 'native' },
	multipoint: { type: 'geometry', geometry_type: 'Multipoint', geometry_format: 'native' },
	multilinestring: { type: 'geometry', geometry_type: 'MultiLinestring', geometry_format: 'native' },
	multipolygon: { type: 'geometry', geometry_type: 'MultiPolygon', geometry_format: 'native' },
	geometry: { type: 'geometry' },
	sdo_geometry: { type: 'geometry' },

	// MySQL
	string: { type: 'text' },
	year: { type: 'integer' },
	blob: { type: 'binary' },
	mediumblob: { type: 'binary' },
	'int unsigned': { type: 'integer' },

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
	jsonb: { type: 'json' },
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

	// Oracle
	number: { type: 'integer' },
};

export default function getLocalType(
	column: SchemaOverview[string]['columns'][string] | Column,
	field?: { special?: FieldMeta['special'] }
): LocalTypeEntry {
	const type = localTypeMap[column.data_type.toLowerCase().split('(')[0]];

	/** Handle Postgres numeric decimals */
	if (column.data_type === 'numeric' && column.numeric_precision !== null && column.numeric_scale !== null) {
		return { type: 'decimal' };
	}

	if (field?.special?.[0] == 'wkt') return { type: 'geometry', geometry_format: 'wkt' };
	if (field?.special?.[0] == 'wkb') return { type: 'geometry', geometry_format: 'wkb' };
	if (field?.special?.[0] == 'geojson') return { type: 'geometry', geometry_format: 'geojson' };
	if (field?.special?.[0] == 'lnglat') return { type: 'geometry', geometry_format: 'lnglat' };

	if (field?.special?.includes('json')) return { type: 'json' };
	if (field?.special?.includes('hash')) return { type: 'hash' };
	if (field?.special?.includes('csv')) return { type: 'csv' };
	if (field?.special?.includes('uuid')) return { type: 'uuid' };

	if (type) {
		return type;
	}

	return { type: 'unknown' };
}
