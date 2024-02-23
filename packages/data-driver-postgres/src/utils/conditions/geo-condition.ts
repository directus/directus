import { tableIndexToIdentifier, type SqlConditionGeoNode } from '@directus/data-sql';
import { applyJsonPathAsGeometry } from '../json-path.js';
import { wrapColumn } from '../wrap-column.js';

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
export const geoCondition = (condition: SqlConditionGeoNode): string => {
	const tableAlias = tableIndexToIdentifier(condition.target.tableIndex);
	const column = wrapColumn(tableAlias, condition.target.columnName);

	const parameterIndex = condition.compareTo.parameterIndex;
	const geomConvertedText = `ST_GeomFromText($${parameterIndex + 1})`;

	if (condition.target.type === 'primitive') {
		return getOperation(condition.operation, column, geomConvertedText);
	} else if (condition.target.type === 'json') {
		const jsonPath = applyJsonPathAsGeometry(column, condition.target.path);

		return getOperation(condition.operation, jsonPath, geomConvertedText);
	} else {
		throw new Error('Not supported!');
	}
};

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
