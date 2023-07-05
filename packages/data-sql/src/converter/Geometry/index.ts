/**
 * Converts geometry values form well known text into a GeoJSON string which is generally supported by databases.
 *
 *
 * @todo Move a layer up so that NoSQL datastore can use this as well.
 *
 */
import { parse as wktToGeoJSON } from 'wellknown';
import type { ParameterTypes } from '../../types.js';

export const convertGeoValues = (parameters: ParameterTypes[]): ParameterTypes[] => {
	return parameters.map((param) => {
		if (typeof param === 'string') {
			const s = wktToGeoJSON(param);

			if (s !== null) {
				return s;
			}
		}

		return param;
	});
};
