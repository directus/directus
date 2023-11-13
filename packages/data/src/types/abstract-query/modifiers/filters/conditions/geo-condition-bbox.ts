import type { GeoJSONGeometryCollection, GeoJSONMultiPolygon, GeoJSONPolygon } from 'wellknown';
import type { AbstractQueryFieldNodeTarget } from '../../../fields.js';

/**
 * Used to check if geo box objects intersect
 */
export interface ConditionGeoIntersectsBBoxNode {
	type: 'condition-geo-intersects-bbox';
	target: AbstractQueryFieldNodeTarget;
	operation: 'intersects_bbox';
	compareTo: GeoJSONPolygon | GeoJSONMultiPolygon | GeoJSONGeometryCollection;
	/** @TODO confirm if MultiPolygon works as expected across drivers */
}
