export const TYPES = [
	'alias',
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
