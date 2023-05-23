/** The root query to be executed */
export interface AbstractQuery {
	/** Marked as entrypoint of the query */
	root: true;

	/** Location where the data is stored */
	datastore: string;

	/** Name of the collection entrypoint within the datastore */
	collection: string;

	/** All fields to select in the query */
	fieldNodes: AbstractQueryFieldNode[];

	/** Optional attributes to perform a fine granular query */
	modifiers?: AbstractQueryModifiers;
}

type AbstractQueryNodeType = 'primitive' | 'fn' | 'm2o' | 'o2m' | 'a2o' | 'o2a';

/**
 * All nodes which can be used within the `fieldNodes` array of the `AbstractQuery` have a type attribute.
 * With this in place it can easily be determined how to technically handle this field.
 * @see `AbstractQueryNodeType` for all possible types.
 */
interface AbstractQueryNode {
	/** the type of the node */
	type: AbstractQueryNodeType;
}

/**
 * The A group of all possible field types.
 * This can be used within the `fieldNodes` array of the `AbstractQuery`.
 */
export type AbstractQueryFieldNode =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeRelated;

/**
 * Generic primitive value read from the datastore field
 * @example
 * Let's say you want the engine to only return the `id` field of the collection in question:
 * For that you would create a node like the following and add it to the `fieldNodes` of the query.
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
}

export type AbstractQueryFn = 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second';

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
}

/**
 * This is a basic interface for all relational field types.
 */
export interface AbstractQueryFieldNodeRelatedBase {
	fieldNodes: AbstractQueryFieldNode[];

	/** Regardless of the type of the relationship, it always possible to add modifiers to the foreign collection to adjust the results. */
	modifiers?: AbstractQueryModifiers;
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
 * 		datastore: 'mongodb',
 * 		collection: 'some-collection',
 * }
 * ```
 */
interface AbstractQueryFieldNodeRelatedJoinMany {
	/** the field of the current collection which has the relational value to an external collection or item */
	current: {
		fields: string[];
	};

	/** the external collection or item which should be pulled/joined/merged into the current collection */
	external: {
		datastore?: string;
		collection: string;
		fields: string[];
	};
}

interface AbstractQueryFieldNodeRelatedJoinAny {
	current: {
		collectionField: string;
		fields: string[];
	};

	external: {
		datastore?: string;
		fields: string[];
	};
}

export interface AbstractQueryFieldNodeRelatedManyToOne extends AbstractQueryNode, AbstractQueryFieldNodeRelatedBase {
	type: 'm2o';

	join: AbstractQueryFieldNodeRelatedJoinMany;
}

export interface AbstractQueryFieldNodeRelatedOneToMany extends AbstractQueryNode, AbstractQueryFieldNodeRelatedBase {
	type: 'o2m';

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
	sort?: AbstractQueryNodeSort;
	filter?: AbstractQueryNodeLogical | AbstractQueryNodeCondition;
}

interface AbstractQueryModifierNode {
	type: 'limit' | 'offset' | 'sort' | 'logical' | 'condition';
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

/**
 * Specifies the order of the results
 */
interface AbstractQueryNodeSort extends AbstractQueryModifierNode {
	type: 'sort';

	/** the desired order */
	direction: 'ascending' | 'descending';

	/** the node on which the sorting should be applied */
	target:
		| AbstractQueryFieldNodePrimitive
		| AbstractQueryFieldNodeFn
		| AbstractQueryFieldNodeRelatedManyToOne
		| AbstractQueryFieldNodeRelatedAnyToOne;
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
 * 			operation: 'eq',
 * 			targetNode: { type: 'field', field: 'a' }
 * 			value: 5
 * 		},
 * 		{
 * 			type: 'condition',
 * 			operation: 'lt',
 * 			targetNode: { type: 'field', field: 'b' }
 * 			value: 28
 * 		}
 *  ]
 * }
 * ```
 * It is also possible to nest conditions with the logical operator.
 * ```
 * {
 * 	type: 'logical',
 * 	operator: 'and',
 * 	childNodes: [
 * 		{
 * 			type: 'condition',
 * 			operation: 'eq',
 * 			targetNode: { type: 'field', field: 'a' }
 * 			value: 5
 * 		},
 * 		{
 * 			type: 'logical',
 * 			operator: 'and',
 * 			childNodes: [
 * 				{
 * 					type: 'condition',
 * 					operation: 'eq',
 * 					targetNode: { type: 'field', field: 'b' }
 * 					value: 'something'
 * 				},
 * 				{
 * 					type: 'condition',
 * 					operation: 'gt',
 * 					targetNode: { type: 'field', field: 'c' }
 * 					value: true
 * 				}
 * 			],
 * 		}
 *  ]
 * }
 * ```
 */
export interface AbstractQueryNodeLogical extends AbstractQueryModifierNode {
	type: 'logical';

	operator: 'and' | 'or' | 'not';

	/** the values for the the operation. */
	childNodes: (AbstractQueryNodeLogical | AbstractQueryNodeCondition)[];
}

/**
 * Used to set conditions on a query. The item in question needs to match all conditions to be returned.
 * @example
 * ```
 * {
 * 		type: 'condition',
 * 		operation: 'lt',
 *		targetNode: { type: 'field', field: 'b' }
 * 		value: 5
 * }
 * ```
 */
export interface AbstractQueryNodeCondition extends AbstractQueryModifierNode {
	type: 'condition';

	/** the node on which the condition should be applied */
	targetNode:
		| AbstractQueryFieldNodePrimitive
		| AbstractQueryFieldNodeFn
		| AbstractQueryFieldNodeRelatedManyToOne
		| AbstractQueryFieldNodeRelatedAnyToOne;

	/** the operation to perform on the target */
	operation:
		| 'eq'
		| 'lt'
		| 'lte'
		| 'gt'
		| 'gte'
		| 'in'
		| 'contains'
		| 'starts_with'
		| 'ends_with'
		| 'intersects'
		| 'intersects_bounding_box';

	/** the above operations can be negated by setting the following attribute to true. */
	negation: boolean;

	/** the conditional value. Might be also a function or sub query in the future */
	value: string | number | boolean;
}

/**
 * @TODO
 * - Should we support "Distinct", if so where does it live (field level vs collection level)
 * - Rethink every / some
 * - Should logical "not" be a node with a single child? --> it's seems easier to work with a boolean flag here - see 'negation' onAbstractQueryNodeCondition
 */
