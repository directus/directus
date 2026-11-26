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

	/**
	 * Set when the read includes versions of the related items
	 */
	versioning?: VersionedNode;
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

	/**
	 * Set per related collection when the read includes versions of the related items
	 */
	versioning?: {
		[collection: string]: VersionedNode;
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

	/**
	 * Set when the read includes versions of the related items
	 */
	versioning?: VersionedNode;
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
};

/**
 * Read of a node that includes versions: live items, with the system fields of their published version, together with
 * all other versions of the collection. The node itself describes the read of the live collection, which permissions
 * are validated against. How the collection is read with its versions is in `schema.versioning.reads`.
 */
export type VersionedNode = {
	/** Parts of the query that apply to the combined rows, with version system fields mapped to their columns */
	query: Pick<Query, 'filter' | 'sort' | 'group' | 'aggregate'>;
	/** Requested version system fields, returned under `directus_version` */
	fields: string[];
	/**
	 * Column with references to versions, which links the node to its parent next to the live relation. It's on the
	 * parent rows for m2o and a2o nodes and on the related rows for o2m nodes.
	 */
	reference: string | null;
	/** Shadow tables the read requires access to, with the fields its filter reads from them */
	shadows: Record<string, string[]>;
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

	/**
	 * Set when the read includes versions of the items
	 */
	versioning?: VersionedNode;
};
