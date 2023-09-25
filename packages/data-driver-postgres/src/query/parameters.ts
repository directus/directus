/**
 * Here the list of parameters created in data-sql are converted here.
 * Currently this only includes the conversion of GeoJSON objects to WKT.
 * @module
 */
import { stringify, type GeoJSONGeometry } from 'wellknown';
import type { ParameterTypes } from '@directus/data-sql';

export function convertParameters(params: ParameterTypes[]) {
	return convertGeoJsonParameterToWKT(params);
}

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
