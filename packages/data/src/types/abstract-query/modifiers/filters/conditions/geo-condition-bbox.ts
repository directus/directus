import type { GeoJSONGeometryCollection, GeoJSONMultiPolygon, GeoJSONPolygon } from 'wellknown';

/**
 * Used to check if geo box objects intersect
 */
export interface ConditionGeoIntersectsBBoxNode<Target> {
	type: 'condition-geo-intersects-bbox';
	target: Target;
	operation: 'intersects_bbox';
	compareTo: GeoJSONPolygon | GeoJSONMultiPolygon | GeoJSONGeometryCollection;
	/** @TODO confirm if MultiPolygon works as expected across drivers */
}
