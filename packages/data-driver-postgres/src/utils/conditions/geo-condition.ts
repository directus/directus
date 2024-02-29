import { type SqlConditionGeoNode } from '@directus/data-sql';
import { convertTarget } from '../convert-target.js';

/**
 * Used to check if a geo shape intersects with another geo shape.
 * @see http://www.postgis.net/docs/ST_Intersects.html
 * @see https://postgis.net/docs/geometry_overlaps.html
 *
 * @remarks
 * The arguments to the PostGis intersect functions need to be in specific 'geometry' object.
 * Therefore the provided geo json, which is stored in the parameter list, needs to be converted using another PostGis function.
 * @see https://postgis.net/docs/ST_GeomFromText.html
 *
 * @param condition
 * @returns
 */
export function geoCondition(condition: SqlConditionGeoNode): string {
	const parameterIndex = condition.compareTo.parameterIndex;
	const geomConvertedText = `ST_GeomFromText($${parameterIndex + 1})`;
	const target = convertTarget(condition.target, 'geo');

	return getOperation(condition.operation, target, geomConvertedText);
}

function getOperation(
	operation: SqlConditionGeoNode['operation'],
	firstOperand: string,
	secondOperand: string,
): string {
	if (operation === 'intersects') {
		return `ST_Intersects(${firstOperand}, ${secondOperand})`;
	} else {
		return `${firstOperand} && ${secondOperand})`;
	}
}
