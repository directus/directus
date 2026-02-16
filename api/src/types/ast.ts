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
