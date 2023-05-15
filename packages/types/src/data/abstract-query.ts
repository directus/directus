/** The root of the abstract query */
export interface AbstractQuery {
	/** Marked as entrypoint of the query */
	root: true;

	/** Place where the data is stored */
	datastore: string;

	/** Name of the collection within the datastore */
	collection: string;

	/** All fields to select in the query */
	fieldNodes: AbstractQueryFieldNode[];

	// modifiers?: {
	// 	limit?: AbstractQueryNodeLimit;
	// 	filter?: AbstractQueryFilterNode[];
	// };
}

type AbstractQueryNodeType = 'primitive' | 'fn' | 'm2o' | 'o2m' | 'a2o' | 'o2a';

interface AbstractQueryNode {
	/** the type of the node */
	type: AbstractQueryNodeType;
}

/** A group of all possible field types */
export type AbstractQueryFieldNode =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeRelated;

/** Generic primitive value read from the datastore field */
export interface AbstractQueryFieldNodePrimitive extends AbstractQueryNode {
	type: 'primitive';

	/** the name of the attribute */
	field: string;
}

export type AbstractQueryFn = 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second';

export interface AbstractQueryFieldNodeFn extends AbstractQueryNode {
	type: 'fn';

	fn: AbstractQueryFn;

	targetNode: AbstractQueryFieldNodePrimitive | AbstractQueryFieldNodeFn;

	args?: (string | number | boolean)[];
}

export interface AbstractQueryFieldNodeRelatedBase {
	fieldNodes: AbstractQueryFieldNode[];

	modifiers?: AbstractQueryModifiers;
}

export type AbstractQueryFieldNodeRelated =
	| AbstractQueryFieldNodeRelatedManyToOne
	| AbstractQueryFieldNodeRelatedOneToMany
	| AbstractQueryFieldNodeRelatedAnyToOne
	| AbstractQueryFieldNodeRelatedOneToAny;

interface AbstractQueryFieldNodeRelatedJoinMany {
	current: {
		fields: string[];
	};

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

// =================================================================================================

/**
 * Optional attributes to customize the query results
 */
export interface AbstractQueryModifiers {
	limit?: AbstractQueryNodeLimit;
	offset?: AbstractQueryNodeOffset;
	sort?: AbstractQueryNodeSort;
	filter?: AbstractQueryNodeLogical | AbstractQueryNodeCondition;
}

/**
 * Specifies the maximum amount of returning results
 */
interface AbstractQueryNodeLimit {
	type: 'limit';
	value: number;
}

/**
 * Specifies the number of items to skip before returning results
 */
interface AbstractQueryNodeOffset {
	type: 'offset';
	value: number;
}

/**
 * Specifies the order of the results
 */
interface AbstractQueryNodeSort {
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
 * Used to create logical operations
 * @example
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
 * 			value: 5
 * 		}
 *  ]
 * }
 * ```
 */
export interface AbstractQueryNodeLogical {
	type: 'logical';

	operator: 'and' | 'or' | 'not';

	/** the values for the the operation. At least two need to be provided. */
	childNodes: (AbstractQueryNodeLogical | AbstractQueryNodeCondition)[];
}

/**
 * Used to create conditional operations
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
export interface AbstractQueryNodeCondition {
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

	/** the conditional value. Might be also a function or sub query in the future */
	value: string | number | boolean;
}

/**
 * Questions:
 * - Should we support "Distinct", if so where does it live (field level vs collection level)
 * - Rethink every / some
 * - Should logical "not" be a node with a single child?
 */
