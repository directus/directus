import type {
	GeoJSONGeometryCollection,
	GeoJSONLineString,
	GeoJSONMultiLineString,
	GeoJSONMultiPoint,
	GeoJSONMultiPolygon,
	GeoJSONPoint,
	GeoJSONPolygon,
} from 'wellknown';
import type { AbstractQueryNode } from '../abstract-query.js';
import type { AbstractQueryFieldNodePrimitive } from '../nodes/primitive.js';
import type { AbstractQueryFieldNodeFn } from '../nodes/function.js';

/**
 * Used to set conditions on a query. The item in question needs to match all conditions to be returned.
 * No explicit support to check for 'empty' (it's just an empty string) and null.
 *
 * @example
 * ```
 * {
 * 		type: 'condition',
 * 		condition: {...}
 * },
 * ```
 */
export interface AbstractQueryConditionNode extends AbstractQueryNode {
	type: 'condition';
	condition: ActualConditionNodes;
}

export type ActualConditionNodes =
	| ConditionLetterNode
	| ConditionNumberNode
	| ConditionGeoIntersectsNode
	| ConditionGeoIntersectsBBoxNode
	| ConditionSetNode
	| ConditionFieldNode;

export type AbstractQueryFilterNode =
	| AbstractQueryNodeLogical
	| AbstractQueryNodeNegate
	// | AbstractQueryQuantifierNode // this will probably be within relational nodes
	| AbstractQueryConditionNode;

/**
 * Used to create logical operations.
 * @example
 * Let's say you want to only return rows where two conditions are true.
 * First condition that some field value needs to be qual to a provided value and another condition that one field is less than another provided value.
 * This would look like this:
 * ```
 * {
 * 	type: 'logical',
 * 	operator: 'and',
 * 	childNodes: [
 * 		{
 * 			type: 'condition',
 * 			condition: {...}
 * 		},
 * 		{
 * 			type: 'condition',
 * 			condition: {...}
 * 		}
 *  ]
 * }
 * ```
 * It is also possible to nest conditions with the logical operator.
 * The following pseudo code mean: A AND (B AND C)
 * ```
 * {
 * 	type: 'logical',
 * 	operator: 'and',
 * 	childNodes: [
 * 		{
 * 			type: 'condition',
 * 			condition: {...}
 * 		},
 * 		{
 * 			type: 'logical',
 * 			operator: 'and',
 * 			childNodes: [
 * 				{
 * 					type: 'condition',
 * 					condition: {...}
 * 				},
 * 				{
 * 					type: 'condition',
 * 					condition: {...}
 * 				},
 * 			],
 * 		}
 *  ]
 * }
 * ```
 */
export interface AbstractQueryNodeLogical extends AbstractQueryNode {
	type: 'logical';
	operator: 'and' | 'or';

	/** the values for the operation. */
	childNodes: AbstractQueryFilterNode[];
}

export interface AbstractQueryNodeNegate extends AbstractQueryNode {
	type: 'negate';

	/** the values for the operation. */
	childNode: AbstractQueryFilterNode;
}

/**
 * Used to compare a string field with a string value.
 * @example
 * ```
 * {
 * 	type: 'condition-letter',
 * 	target: {
 * 		type: 'primitive',
 * 		field: 'attribute_xy'
 * 	},
 * 	operation: 'contains',
 * 	compareTo: 'someString'
 * ```
 */
export interface ConditionLetterNode {
	type: 'condition-letter';
	target: AbstractQueryFieldNodePrimitive; // | AbstractQueryFieldNodeFn; how do we check of the target is a valid input for the function?
	operation: 'contains' | 'starts_with' | 'ends_with' | 'eq' /** @TODO maybe regex? */;
	compareTo: string;
}

/**
 * Used to compare a number or date time field with a number value.
 * @example
 * ```
 * {
 * 	type: 'condition-number',
 * 	target: {
 * 		type: 'primitive',
 * 		field: 'attribute_xy'
 * 	},
 * 	operation: 'lt',
 * 	compareTo: 5
 * ```
 */
export interface ConditionNumberNode extends AbstractQueryNode {
	type: 'condition-number';
	target: AbstractQueryFieldNodePrimitive | AbstractQueryFieldNodeFn;
	operation: 'eq' | 'lt' | 'lte' | 'gt' | 'gte';
	compareTo: number;
}

/**
 * Checks if a geo field intersects with another geo value.
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
	target: AbstractQueryFieldNodePrimitive /** the type of the field needs to be a 'geometry' object */;
	operation: 'intersects';
	compareTo: GeoJSONPoint | GeoJSONMultiPoint | GeoJSONLineString | GeoJSONMultiLineString | GeoJSONGeometryCollection;
}

export interface ConditionGeoIntersectsBBoxNode {
	type: 'condition-geo-intersects-bbox';
	target: AbstractQueryFieldNodePrimitive;
	operation: 'intersects_bbox';
	compareTo: GeoJSONPolygon | GeoJSONMultiPolygon | GeoJSONGeometryCollection;
	/** @TODO confirm if MultiPolygon works as expected across drivers */
}

/**
 * Used to compare a number field with a number value.
 * @example
 * ```
 * {
 * 	type: 'condition-set',
 * 	target: {
 * 		type: 'primitive',
 * 		field: 'attribute_xy'
 * 	},
 * 	operation: 'in',
 * 	compareTo: [1, 2, 3]
 * ```
 */
export interface ConditionSetNode {
	type: 'condition-set';
	target: AbstractQueryFieldNodePrimitive;
	operation: 'in';
	compareTo: (string | number)[]; // could also be an actual JS Set
}

/**
 * It's mainly used to compare two fields for relational queries.
 * That's why only the qe comparator is valid.
 */
export interface ConditionFieldNode {
	type: 'condition-field';
	target: AbstractQueryFieldNodePrimitive;
	operation: 'eq';
	compareTo: AbstractQueryFieldNodePrimitive & { collection: string };
}
