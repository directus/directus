export const KNEX_TYPES = [
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
] as const;

export const TYPES = [
	...KNEX_TYPES,
	'alias',
	'hash',
	'csv',
	'geometry',
	'geometry.Point',
	'geometry.LineString',
	'geometry.Polygon',
	'geometry.MultiPoint',
	'geometry.MultiLineString',
	'geometry.MultiPolygon',
	'unknown',
] as const;

export const NUMERIC_TYPES = ['bigInteger', 'decimal', 'float', 'integer'] as const;

export const GEOMETRY_TYPES = [
	'Point',
	'LineString',
	'Polygon',
	'MultiPoint',
	'MultiLineString',
	'MultiPolygon',
] as const;

export const GEOMETRY_FORMATS = ['native', 'geojson', 'wkt', 'lnglat'] as const;

export const LOCAL_TYPES = [
	'standard',
	'file',
	'files',
	'm2o',
	'o2m',
	'm2m',
	'm2a',
	'presentation',
	'translations',
	'group',
] as const;

export const RELATIONAL_TYPES = ['file', 'files', 'm2o', 'o2m', 'm2m', 'm2a', 'translations'] as const;

export const FUNCTIONS = [
	'year',
	'month',
	'week',
	'day',
	'weekday',
	'hour',
	'minute',
	'second',
	'count',
	'json',
] as const;

export const SEARCHABLE_TYPES = ['text', 'string', 'integer', 'bigInteger', 'float', 'decimal', 'uuid'] as const;
