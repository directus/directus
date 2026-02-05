import type { Filter, Query, Relation } from '@directus/types';

export type M2ONode = {
	type: 'm2o';
	name: string;
	children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[];
	query: Query;
	fieldKey: string;
	relation: Relation;
	parentKey: string;
	relatedKey: string;

	/**
	 * Which permission cases have to be met on the current item for this field to return a value
	 */
	whenCase: number[];

	/**
	 * Permissions rules for the item access of the children of this item.
	 */
	cases: Filter[];
};

export type A2MNode = {
	type: 'a2o';
	names: string[];
	children: {
		[collection: string]: (NestedCollectionNode | FieldNode | FunctionFieldNode)[];
	};
	query: {
		[collection: string]: Query;
	};
	relatedKey: {
		[collection: string]: string;
	};

	fieldKey: string;
	relation: Relation;
	parentKey: string;

	/**
	 * Which permission cases have to be met on the current item for this field to return a value
	 */
	whenCase: number[];

	/**
	 * Permissions rules for the item access of the children of this item.
	 */
	cases: {
		[collection: string]: Filter[];
	};
};

export type O2MNode = {
	type: 'o2m';
	name: string;
	children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[];
	query: Query;
	fieldKey: string;
	relation: Relation;
	parentKey: string;
	relatedKey: string;

	/**
	 * Which permission cases have to be met on the current item for this field to return a value
	 */
	whenCase: number[];

	/**
	 * Permissions rules for the item access of the children of this item.
	 */
	cases: Filter[];
};

export type NestedCollectionNode = M2ONode | O2MNode | A2MNode;

export type FieldNode = {
	type: 'field';
	name: string;
	fieldKey: string;
	/** If the field was created through alias query parameters */
	alias: boolean;

	/**
	 * Which permission cases have to be met on the current item for this field to return a value
	 */
	whenCase: number[];
};

/**
 * Context for relational JSON field access (e.g., json(category.metadata:color))
 */
export type RelationalJsonContext = {
	/** The relational path segments, e.g., ['category'] or ['author', 'profile'] */
	relationalPath: string[];
	/** The JSON field name on the target collection, e.g., 'metadata' */
	jsonField: string;
	/** The JSON path within the field, e.g., '.color' or '.items[0].name' */
	jsonPath: string;
	/** Whether the JSON path contains array wildcards (e.g., '.items[].name') */
	hasWildcard: boolean;
	/** The type of relation: m2o returns single value, o2m returns array */
	relationType: 'm2o' | 'o2m';
	/** The relation object containing FK info for subquery correlation */
	relation: Relation;
	/** The target collection containing the JSON field */
	targetCollection: string;
};

export type FunctionFieldNode = {
	type: 'functionField';
	name: string;
	fieldKey: string;
	query: Query;
	relatedCollection: string;

	/**
	 * Which permission cases have to be met on the current item for this field to return a value
	 */
	whenCase: number[];
	/**
	 * Permissions rules for the item access of the related collection of this item.
	 */
	cases: Filter[];

	/**
	 * Context for relational JSON access (e.g., json(category.metadata:color)).
	 * Present when the json() function targets a JSON field on a related collection.
	 */
	relationalJsonContext?: RelationalJsonContext;
};

export type AST = {
	type: 'root';
	name: string;
	children: (NestedCollectionNode | FieldNode | FunctionFieldNode)[];
	query: Query;

	/**
	 * Permissions rules for the item access of the children of this item.
	 */
	cases: Filter[];
};
