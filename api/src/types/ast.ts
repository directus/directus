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
 * Context for relational JSON field access (e.g., json(category.metadata, color))
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
	/** The type of relation: m2o returns single value, o2m/a2o return array */
	relationType: 'm2o' | 'o2m' | 'a2o';
	/** The relation object containing FK info for subquery correlation */
	relation: Relation;
	/** The target collection containing the JSON field */
	targetCollection: string;
	/** For a2o: the collection scope, e.g., 'circles' from 'item:circles' */
	collectionScope?: string;
	/** For a2o: the junction collection table name */
	junctionCollection?: string;
	/** For a2o: the name of the collection discriminator field on the junction, e.g., 'collection' */
	oneCollectionField?: string;
	/** For a2o: the FK field on the junction pointing back to the parent, e.g., 'shapes_children_id' */
	junctionParentField?: string;
	/** For a2o: the polymorphic item FK field on the junction, e.g., 'item' */
	junctionItemField?: string;
	/** For a2o: the O2M relation from parent to junction (needed for parent FK correlation) */
	o2mRelation?: Relation;
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
	 * Context for relational JSON access (e.g., json(category.metadata, color)).
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
