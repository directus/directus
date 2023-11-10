import type {
	GeoJSONGeometryCollection,
	GeoJSONLineString,
	GeoJSONMultiLineString,
	GeoJSONMultiPoint,
	GeoJSONPoint,
} from 'wellknown';

import type { AbstractQueryFieldNodeTarget } from '../../../fields.js';

/**
 * Checks if a non box geo object intersects with another.
 * @example
 * ```
 * {
 * 	type: 'condition-geo',
 * 	target: {
 * 		type: 'primitive',
 * 		field: 'attribute_xy'
 * 	},
 * 	operation: 'intersects',
 * 	compareTo: {
 * 		"type": "Feature",
 * 		"geometry": {
 *   		"type": "Point",
 *   		"coordinates": [125.6, 10.1]
 * 		},
 *		"properties": {
 *   	"name": "Dinagat Islands"
 * 	}
 * }
 * ```
 */
export interface ConditionGeoIntersectsNode {
	type: 'condition-geo-intersects';
	target: AbstractQueryFieldNodeTarget /** the type of the field needs to be a 'geometry' object */;
	operation: 'intersects';
	compareTo: GeoJSONPoint | GeoJSONMultiPoint | GeoJSONLineString | GeoJSONMultiLineString | GeoJSONGeometryCollection;
}
