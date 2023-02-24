import { Query, Relation } from '@directus/shared/types';

export type M2ONode = {
	type: 'm2o';
	name: string;
	children: ASTNode[];
	query: Query;
	fieldKey: string;
	relation: Relation;
	parentKey: string;
	relatedKey: string;
};

export type A2MNode = {
	type: 'a2o';
	names: string[];
	children: {
		[collection: string]: ASTNode[];
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
};

export type O2MNode = {
	type: 'o2m';
	name: string;
	children: ASTNode[];
	query: Query;
	fieldKey: string;
	relation: Relation;
	parentKey: string;
	relatedKey: string;
};

export type NestedCollectionNode = M2ONode | O2MNode | A2MNode;

export type FieldNode = {
	type: 'field';
	name: string;
	fieldKey: string;
};

export type FunctionFieldNode = {
	type: 'functionField';
	name: string;
	fieldKey: string;
	query: Query;
	relatedCollection: string;
};

export type JsonFieldNode = {
	type: 'jsonField';
	// name of the database field
	name: string;
	// alias to use for the result
	fieldKey: string;
	// json-path to query
	jsonPath: string;
	// additional filters
	query: Query;
	// temporary nodes do not need to be in the final API response
	// these are sometimes required for filtering
	temporary: boolean;
};

export type ASTNode = NestedCollectionNode | FieldNode | FunctionFieldNode | JsonFieldNode;

export type AST = {
	type: 'root';
	name: string;
	children: ASTNode[];
	query: Query;
};
