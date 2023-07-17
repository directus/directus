/**
 * Due to the decision of always passing the query and only the query to the converter functions,
 * the conversion cannot of the parameters cannot be done within those, and hence will be done here.
 * @module
 */
import { stringify, type GeoJSONGeometry } from 'wellknown';
import type { ParameterTypes } from '@directus/data-sql';

/**
 * Goes through the list of parameters and converts all GeoJson objects to a WKT representation.
 * @param params - the list of parameters
 * @returns - a list where all GeoJson objects were converted to a string
 */
export function convertGeoJsonParameterToWKT(params: ParameterTypes[]): ParameterTypes[] {
	return params.map((p) => {
		if (isGeoJson(p)) {
			return stringify(p as GeoJSONGeometry);
		}

		return p;
	});
}

/**
 * Checks if a given parameter is a GeoJSON object or not.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7946#section-1.4
 * @param parameter
 * @returns true if the parameter is a GeoJSON object
 */
function isGeoJson(parameter: ParameterTypes): boolean {
	if (typeof parameter === 'object') {
		const props = Object.keys(parameter);

		if (props.includes('type')) {
			[
				'Point',
				'MultiPoint',
				'LineString',
				'MultiLineString',
				'Polygon',
				'MultiPolygon',
				'GeometryCollection',
			].includes(parameter.type);

			return true;
		}
	}

	return false;
}
