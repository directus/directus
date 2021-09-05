import { FieldOverview } from '../types';
const dbGeometricTypes = new Set([
	'point',
	'polygon',
	'linestring',
	'multipoint',
	'multipolygon',
	'multilinestring',
	'geometry',
	'geometrycollection',
	'sdo_geometry',
	'user-defined',
]);

export function isNativeGeometry(field: FieldOverview): boolean {
	const { type, dbType } = field;
	return type == 'geometry' && dbGeometricTypes.has(dbType!.toLowerCase());
}
