import { FieldFilterOperator, Query, Relation } from '@directus/shared/types';

export type M2ONode = {
	type: 'm2o';
	name: string;
	children: ASTChildNode[];
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
		[collection: string]: ASTChildNode[];
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
	children: ASTChildNode[];
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

// export type JsonFieldNode = {
// 	type: 'jsonField';
// 	name: string;
// 	fieldKey: string;
// 	alias: string;
// };

export type JsonFieldNode = {
	type: 'jsonField';
	name: string;
	fieldKey: string;
	fieldName: string;
	queryPath: string;
	filter?: FieldFilterOperator;
};

export type ASTChildNode = NestedCollectionNode | FieldNode | FunctionFieldNode | JsonFieldNode;

export type AST = {
	type: 'root';
	name: string;
	children: ASTChildNode[];
	query: Query;
};
