/**
 * All types which are used within the data packages
 * A type which ends with "Node" means that it doesn't have anything nested - it's the end of a brunch of the tree.
 */

/**
 * The root of the abstracy query
 * @typeParam type - set to "root"
 * @typeParam collection - name of the collection within the datastore
 * @typeParam datastore - place where the data is stored
 * @typeParam fields - all fields to select in the query
 */
export type AbstractQuery = {
	type: 'root';
	collection: string;
	datastore: string;
	fields: Field[];
};

/**
 * A goup of all possible field types
 */
export type Field = FieldNode | FunctionNode | NestedItemNode | NestedCollectionNode;

/**
 * The root of the abstracy query
 * @typeParam type - set to "field"
 * @typeParam key - the name of the attribute
 * @typeParam alias - a custom name for the field
 * @typeParam distinct - to return only different values
 */
export type FieldNode = {
	type: 'field';
	key: string;
	alias?: string;
	distinct?: boolean;
};

/**
 * The root of the abstracy query
 * @typeParam type - set to "field"
 * @typeParam key - the name of the attribute
 * @typeParam alias - a custom name for the field
 * @typeParam distinct - to return only different values
 */
export type FunctionNode = {
	type: 'function';
	fn: string;
	target: FieldNode | FunctionNode;
	alias?: string;
};

/**
 * Shared attributes used by nested item/collection nodes
 * @typeParam alias - a custom name other than the field name
 * @typeParam collection - name of the collection within the datastore
 * @typeParam fields - fields to select from the referenced collection
 */
type NestedNode = {
	alias?: string;
	collection: string;
	fields: Field[];
	meta: {
		// TODO: do some/all as string arrays for composite keys
		datastore: string;
		referenceKey: string;
		foreignIdentifier: string;
		relationType: 'm2o' | 'o2m' | 'a2o';
	};
};

/**
 * Shared attributes used by nested item/collection nodes
 * @typeParam alias - a custom name other than the field name
 * @typeParam collection - name of the collection within the datastore
 * @typeParam fields - fields to select from the referenced collection
 */
export type NestedItemNode = {
	type: 'item';
} & NestedNode;

export type NestedCollectionNode = {
	type: 'collection';
	// Modifiers and groups coming soon
} & NestedNode;
