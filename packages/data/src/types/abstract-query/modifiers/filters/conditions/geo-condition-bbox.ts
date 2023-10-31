import type { GeoJSONGeometryCollection, GeoJSONMultiPolygon, GeoJSONPolygon } from 'wellknown';
import type { AbstractQueryFieldNodePrimitive } from '../../../fields/primitive.js';
import type { AbstractQueryFieldNodeNestedTarget } from '../../../fields/nested.js';

/**
 * Used to check if geo box objects intersect
 */
export interface ConditionGeoIntersectsBBoxNode {
	type: 'condition-geo-intersects-bbox';
	target: AbstractQueryFieldNodePrimitive | AbstractQueryFieldNodeNestedTarget;
	operation: 'intersects_bbox';
	compareTo: GeoJSONPolygon | GeoJSONMultiPolygon | GeoJSONGeometryCollection;
	/** @TODO confirm if MultiPolygon works as expected across drivers */
}
