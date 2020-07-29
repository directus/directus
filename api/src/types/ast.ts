import { Query } from './query';
import { Relation } from './relation';

export type NestedCollectionAST = {
	type: 'collection';
	name: string;
	children: (NestedCollectionAST | FieldAST)[];
	query: Query;
	fieldKey: string;
	relation: Relation;
	parentKey: string;
};

export type FieldAST = {
	type: 'field';
	name: string;
};

export type AST = {
	type: 'collection';
	name: string;
	children: (NestedCollectionAST | FieldAST)[];
	query: Query;
};
