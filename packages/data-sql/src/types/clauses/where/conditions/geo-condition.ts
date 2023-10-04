import type { ValueNode } from '../../../parameterized-statement.js';
import type { AbstractSqlQuerySelectNode } from '../../selects/primitive.js';

/**
 * Used to retrieve a set of data, where the column in question stores a geographic value which intersects with another given geographic value.
 * Here, the two types `condition-geo` and `condition-geo-bbox` from @directus/data are combined into one type,
 * because the compare value is the same for both types - it's the reference to the actual value stored in the list of parameters.
 * That also why the operations got merged together.
 */
export interface SqlConditionGeoNode {
	type: 'condition-geo';

	/* The column in question */
	target: AbstractSqlQuerySelectNode;

	/**
	 * The operation to apply. Get only those rows where the targeting column
	 * - `intersects`: intersects with the given geo value
	 * - `intersects_bbox`: intersects with a given bounding box
	 */
	operation: 'intersects' | 'intersects_bbox';

	/*
	 * The geo value to compare the value of the column with.
	 * This needs to be a reference to a geojson object stored in the list of parameters.
	 */
	compareTo: ValueNode;
}
