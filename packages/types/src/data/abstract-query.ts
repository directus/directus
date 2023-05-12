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

	modifiers?: Modifiers;
}

export type AbstractQueryFieldNodeRelated = AbstractQueryFieldNodeRelatedMany | AbstractQueryFieldNodeRelatedAny;

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

export interface AbstractQueryFieldNodeRelatedBase {
	fieldNodes: AbstractQueryFieldNode[];

	modifiers?: Modifiers;
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
 * @typeParam sort - Specifies the order of the results
 * @typeParam limit - Specifies the maximum amount of returning results
 */
export interface Modifiers {
	limit?: AbstractQueryNodeLimit;
	offset?: AbstractQueryNodeOffset;
	sort?: AbstractQueryNodeSort;
	filter?: AbstractQueryNodeLogical | AbstractQueryNodeCondition;
}

/**
 * Specifies the maximum amount of returning results
 * @typeParam type - set to 'limit'
 * @typeParam value - the limit value
 */
interface AbstractQueryNodeLimit {
	type: 'limit';
	value: number;
}

/**
 * Specifies the number of items to skip before returning results
 * @typeParam type - set to 'offset'
 * @typeParam value - the offset value
 */
interface AbstractQueryNodeOffset {
	type: 'offset';
	value: number;
}

/**
 * Specifies the order of the results
 * @typeParam type - set to 'sort'
 * @typeParam direction - 'ascending' or 'descending'
 * @typeParam target - the node on which the sorting should be applied
 */
interface AbstractQueryNodeSort {
	type: 'sort';
	direction: 'ascending' | 'descending';
	target: AbstractQueryFieldNodePrimitive | AbstractQueryFieldNodeFn | AbstractQueryFieldNodeRelated;
}

/**
 * Used to create logical operations
 * @typeParam type - set to 'sort'
 * @typeParam operator - the logical operator to use
 * @typeParam children - left and right side of the operation.
 * @example
 * ```
 * {
 * 	type: 'logical',
 * 	operator: '_and',
 * 	children: [
 * 		{
 * 			type: 'condition',
 * 			operation: '_eq',
 * 			target: { type: 'field', key: 'a' }
 * 			value: 5
 * 		},
 * 		{
 * 			type: 'condition',
 * 			operation: '_lt',
 * 			target: { type: 'field', key: 'b' }
 * 			value: 5
 * 		}
 *  ]
 * }
 * ```
 */
export interface AbstractQueryNodeLogical {
	type: 'logical';
	operator: 'and' | 'or' | 'not';
	childNodes: (AbstractQueryNodeLogical | AbstractQueryNodeCondition)[];
}

/**
 * Used to create conditional operations
 * @typeParam type - set to 'condition'
 * @typeParam target - the node on which the sorting should be applied
 * @typeParam operation - the operation to perform on the target
 * @typeParam value - the conditional value. Might be also a function or sub query in the future
 * @example
 * ```
 * {
 * 		type: 'condition',
 * 		operation: '_lt',
 *		target: { type: 'field', key: 'b' }
 * 		value: 5
 * }
 * ```
 */
export interface AbstractQueryNodeCondition {
	type: 'condition';
	targetNode:
		| AbstractQueryFieldNodePrimitive
		| AbstractQueryFieldNodeFn
		| AbstractQueryFieldNodeRelatedManyToOne
		| AbstractQueryFieldNodeRelatedAnyToOne;
	operation:
		| 'eq'
		| 'lt'
		| 'lte'
		| 'gt'
		| 'gte'
		| 'in'
		| 'contains'
		| 'starts_with'
		| 'end_with'
		| 'intersects'
		| 'intersects_bbox';
	value: string | number | boolean;
}

/**
 * Questions:
 * - 	Should we support "Distinct", if so where does it live (field level vs collection level)
 * -  Rethink every / some
 */
