import type {
	GeoJSONGeometryCollection,
	GeoJSONLineString,
	GeoJSONMultiLineString,
	GeoJSONMultiPoint,
	GeoJSONMultiPolygon,
	GeoJSONPoint,
	GeoJSONPolygon,
} from 'wellknown';

/**
 * The query can be seen as a tree with various nodes.
 * Each node has a type and different attributes.
 *
 * @module abstract-query
 */

/**
 * The abstract root query
 */
export interface AbstractQuery {
	/** Marked as entrypoint of the query */
	root: boolean;

	/** Location where the data is stored */
	store: string;

	/** Name of the collection entrypoint within the store */
	collection: string;

	/** All fields to select in the query */
	nodes: AbstractQueryFieldNode[];

	/** Optional attributes to perform a fine granular query */
	modifiers?: AbstractQueryModifiers;
}

type AbstractQueryNodeType = 'primitive' | 'fn' | 'm2o' | 'o2m' | 'a2o' | 'o2a';

/**
 * All nodes which can be used within the `nodes` array of the `AbstractQuery` have a type attribute.
 * With this in place it can easily be determined how to technically handle this field.
 * @see `AbstractQueryNodeType` for all possible types.
 */
interface AbstractQueryNode {
	/** the type of the node */
	type: AbstractQueryNodeType;
}

/**
 * A group of all possible field types.
 * This can be used within the `nodes` array of the `AbstractQuery`.
 */
export type AbstractQueryFieldNode =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeRelated;

/**
 * Generic primitive value read from the store field
 * @example
 * Let's say you want the engine to only return the `id` field of the collection in question:
 * For that you would create a node like the following and add it to the `nodes` of the query.
 * ```
 * const primitiveField: AbstractQueryFieldNodePrimitive = {
 * 	type: 'primitive',
 * 	field: 'attribute_xy'
 * }
 * ```
 */
export interface AbstractQueryFieldNodePrimitive extends AbstractQueryNode {
	type: 'primitive';

	/** the name of the attribute */
	field: string;

	alias?: string;
}

export type AbstractQueryFn = 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second' | 'count';

/**
 * Used to apply a function to a specific field before returning it.
 * @example
 * There are several functions available.
 * Let's say you want to only return the year of a date field:
 * ```js
 * const functionNode: AbstractQueryFieldNodeFn = {
 * 	type: 'fn',
 * 	fn: 'year',
 * 	targetNode: {
 * 	type: 'primitive',
 * 	field: 'date_created'
 * }
 * ```
 */
export interface AbstractQueryFieldNodeFn extends AbstractQueryNode {
	type: 'fn';

	fn: AbstractQueryFn;

	targetNode: AbstractQueryFieldNodePrimitive | AbstractQueryFieldNodeFn;

	args?: (string | number | boolean)[];

	alias?: string;
}

/**
 * This is a basic interface for all relational field types.
 */
export interface AbstractQueryFieldNodeRelatedBase {
	nodes: AbstractQueryFieldNode[];

	/** Regardless of the type of the relationship, it always possible to add modifiers to the foreign collection to adjust the results. */
	modifiers?: AbstractQueryModifiers;

	alias: string;
}

/**
 * With those Used to build a relational query for m2o and o2m relations.
 */
export type AbstractQueryFieldNodeRelated =
	| AbstractQueryFieldNodeRelatedManyToOne
	| AbstractQueryFieldNodeRelatedOneToMany
	| AbstractQueryFieldNodeRelatedAnyToOne
	| AbstractQueryFieldNodeRelatedOneToAny;

/**
 * Used to build a relational query for m2o and o2m relations.
 * @example
 * ```
 * const functionNode = {
 * 	current: {
 * 		fields: ['id']
 *  },
 * 	external: {
 * 		store: 'mongodb',
 * 		collection: 'some-collection',
 * }
 * ```
 */
export interface AbstractQueryFieldNodeRelatedJoinMany {
	/** the field of the current collection which has the relational value to an external collection or item */
	current: {
		fields: string[];
	};

	/** the external collection or item which should be pulled/joined/merged into the current collection */
	external: {
		store?: string;
		collection: string;
		fields: string[];
	};
}

export interface AbstractQueryFieldNodeRelatedJoinAny {
	current: {
		collectionField: string;
		fields: string[];
	};

	external: {
		store?: string;
		fields: string[];
	};
}

export interface AbstractQueryFieldNodeRelatedManyToOne extends AbstractQueryNode, AbstractQueryFieldNodeRelatedBase {
	type: 'm2o';

	join: AbstractQueryFieldNodeRelatedJoinMany;
}

export interface AbstractQueryFieldNodeRelatedOneToMany extends AbstractQueryNode, AbstractQueryFieldNodeRelatedBase {
	type: 'o2m';
	// maybe every here
	join: AbstractQueryFieldNodeRelatedJoinMany;
}

export interface AbstractQueryFieldNodeRelatedAnyToOne extends AbstractQueryNode, AbstractQueryFieldNodeRelatedBase {
	type: 'a2o';

	join: AbstractQueryFieldNodeRelatedJoinAny;
}

export interface AbstractQueryFieldNodeRelatedOneToAny extends AbstractQueryNode, AbstractQueryFieldNodeRelatedBase {
	type: 'o2a';

	join: AbstractQueryFieldNodeRelatedJoinAny;
}

// ======================================== Modifiers =========================================================

/**
 * Optional attributes to customize the query results
 */
export interface AbstractQueryModifiers {
	limit?: AbstractQueryNodeLimit;
	offset?: AbstractQueryNodeOffset;
	sort?: AbstractQueryNodeSort[];
	filter?: AbstractQueryFilterNode;
}

interface AbstractQueryModifierNode {
	type: string;
	// 'limit' | 'offset' | 'sort' | 'logical' | 'condition-letter' | 'nu'| 'negate' | 'quantifier';
}

/**
 * Specifies the maximum amount of returning results
 */
interface AbstractQueryNodeLimit extends AbstractQueryModifierNode {
	type: 'limit';
	value: number;
}

/**
 * Specifies the number of items to skip before returning results
 */
interface AbstractQueryNodeOffset extends AbstractQueryModifierNode {
	type: 'offset';
	value: number;
}

export type AbstractQueryNodeSortTargets =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	/**  @TODO when we implement relations: */
	| AbstractQueryFieldNodeRelatedManyToOne
	| AbstractQueryFieldNodeRelatedAnyToOne;

/**
 * Specifies the order of the result, f.e. for a primitive field.
 * @example
 * ```js
 * const sortNode = {
 * 		type: 'sort',
 * 		direction: 'ascending',
 * 		target: {
 * 			type: 'primitive',
 * 			field: 'attribute_xy'
 * 		}
 * }
 * ```
 * Alternatively a function can be applied a the field.
 * The result is then used for sorting.
 * @example
 * ```js
 * const sortNode = {
 * 		type: 'sort',
 * 		direction: 'ascending',
 * 		target: {
 * 			type: 'fn',
 * 			fn: 'year',
 * 			targetNode: {
 * 				type: 'primitive'
 * 				field: 'date_created'
 * 		}
 * }
 */
export interface AbstractQueryNodeSort extends AbstractQueryModifierNode {
	type: 'sort';

	/** the desired order */
	direction: 'ascending' | 'descending';

	/** the node on which the sorting should be applied */
	target: AbstractQueryNodeSortTargets;
}

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
export type AbstractQueryFilterNode =
	| AbstractQueryNodeLogical
	| AbstractQueryNodeNegate
	| AbstractQueryQuantifierNode // this will probably be within relational nodes
	| AbstractQueryConditionNode;

export interface AbstractQueryNodeLogical extends AbstractQueryModifierNode {
	type: 'logical';
	operator: 'and' | 'or';

	/** the values for the operation. */
	childNodes: AbstractQueryFilterNode[];
}

export interface AbstractQueryNodeNegate extends AbstractQueryModifierNode {
	type: 'negate';

	/** the values for the operation. */
	childNode: AbstractQueryFilterNode;
}

// continue on it after relationships
export interface AbstractQueryQuantifierNode extends AbstractQueryModifierNode {
	type: 'quantifier';
	operator: 'every' | 'some';

	/** The o2m field that the every/some should be applied on */
	target: AbstractQueryFieldNodeRelatedOneToMany | AbstractQueryFieldNodeRelatedOneToAny;

	/** An alias to reference the o2m item */
	alias: string;

	/** the values for the the operation. */
	childNode: AbstractQueryFilterNode;
}

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
export interface AbstractQueryConditionNode {
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
export interface ConditionNumberNode {
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

/**
 * @TODO
 * - Rethink every / some
 */
