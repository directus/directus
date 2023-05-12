/**
 * All types which are used within the data packages
 */

/**
 * The root of the abstract query
 * @typeParam type - set to "root"
 * @typeParam collection - name of the collection within the datastore
 * @typeParam datastore - place where the data is stored
 * @typeParam fields - all fields to select in the query
 */
export type AbstractQuery = {
	type: 'root';
	collection: string;
	datastore: string;
	fields: FieldTypes[];
};

/**
 * A group of all possible field types
 */
export type FieldTypes = Field | Func | ForeignItem | ForeignCollection;

/**
 * The root of the abstract query
 * @typeParam type - set to "field"
 * @typeParam key - the name of the attribute
 * @typeParam alias - a custom name for the field
 * @typeParam distinct - to return only different values
 */
export type Field = {
	type: 'field';
	key: string;
	alias?: string;
	distinct?: boolean;
};

/**
 * The root of the abstract query
 * @typeParam type - set to "field"
 * @typeParam key - the name of the attribute
 * @typeParam alias - a custom name for the field
 * @typeParam distinct - to return only different values
 */
export type Func = {
	type: 'function';
	fn: 'year' | 'month' | 'week' | 'day' | 'weekday' | 'hour' | 'minute' | 'second' | 'count' | 'json';
	target: Field | Func;
	alias?: string;
};

/**
 * Shared attributes used by nested item/collection nodes
 * @typeParam alias - a custom name other than the field name
 * @typeParam collection - name of the collection within the datastore
 * @typeParam fields - fields to select from the referenced collection
 */
type ForeignReference = {
	alias?: string;
	collection: string;
	fields: FieldTypes[];
	meta: MetaInformation;
};

/**
 * Technical information which describes a relation between collections.
 * Needed to perform the nested queries and merge them together.
 * @typeParam datastore - the datastore where the data is stored, can be the same as the root query or a different one
 * @typeParam foreignIdentifierField - the name of the field which identifies an item in referred collection
 * @typeParam referenceField - the field in the root collection which holds the value of the foreign identifier. It's used to merge the foreign data into the root results.
 * @typeParam relationType - the type of the relation between the collections. Can be 'm2o', 'o2m' or 'a2o'
 */
type MetaInformation = {
	// TODO: change some/all to string arrays for composite keys
	datastore: string;
	foreignIdentifierField: string;
	referenceField: string;
	relationType: 'm2o' | 'o2m' | 'a2o';
};

/**
 * An related item stored in a foreign collection.
 * It can be stored in the same database or a different one.
 * @typeParam type - set to 'item'
 */
export type ForeignItem = {
	type: 'item';
} & ForeignReference;

/**
 * A related foreign collection.
 * It can be stored in the same database or a different one.
 * @typeParam type - set to 'collection'
 * @typeParam modifiers - optional attributes to customize the query results
 */
export type ForeignCollection = {
	type: 'collection';
	modifiers?: Modifiers;
} & ForeignReference;

/**
 * Optional attributes to customize the query results
 * @typeParam sort - Specifies the order of the results
 * @typeParam limit - Specifies the maximum amount of returning results
 */
export type Modifiers = {
	limit?: Limit;
	offset?: Offset;
	sort?: Sort;
	filter?: LogicalOperation | ConditionalOperation;
};

/**
 * Specifies the maximum amount of returning results
 * @typeParam type - set to 'limit'
 * @typeParam value - the limit value
 */
type Limit = {
	type: 'limit';
	value: number;
};

/**
 * Specifies the number of items to skip before returning results
 * @typeParam type - set to 'offset'
 * @typeParam value - the offset value
 */
type Offset = {
	type: 'offset';
	value: number;
};

/**
 * Specifies the order of the results
 * @typeParam type - set to 'sort'
 * @typeParam direction - 'ascending' or 'descending'
 * @typeParam target - the node on which the sorting should be applied
 */
type Sort = {
	type: 'sort';
	direction: 'ascending' | 'descending';
	target: Field | Func | ForeignItem;
};

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
export type LogicalOperation = {
	type: 'logical';
	operator: '_and' | '_or' | '_not' | '_all' | '_some' | '_none';
	children: (LogicalOperation | ConditionalOperation)[];
};

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
export type ConditionalOperation = {
	type: 'condition';
	target: Field | Func | ForeignItem;
	operation:
		| '_eq'
		| '_lt'
		| '_lte'
		| '_gt'
		| '_gte'
		| '_in'
		| '_contains'
		| '_starts_with'
		| '_end_with'
		| '_intersects'
		| '_intersects_bbox';
	value: string | number | boolean;
};
