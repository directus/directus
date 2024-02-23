import { tableIndexToIdentifier, type SqlConditionGeoNode } from '@directus/data-sql';
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

	if (condition.target.type === 'json') {
		throw Error('JSON target for geo condition is not yet supported');
	}

	const parameterIndex = condition.compareTo.parameterIndex;
	const geomConvertedText = `ST_GeomFromText($${parameterIndex + 1})`;

	switch (condition.operation) {
		case 'intersects':
			return `ST_Intersects(${column}, ${geomConvertedText})`;
		case 'intersects_bbox':
			return `${column} && ${geomConvertedText})`;
	}
};
