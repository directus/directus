import { Query } from './query';
import { Relation } from './relation';

export type M2ONode = {
	type: 'm2o';
	name: string;
	children: (NestedCollectionNode | FieldNode)[];
	query: Query;
	fieldKey: string;
	relation: Relation;
	parentKey: string;
};

export type O2MNode = {
	type: 'o2m';
	name: string;
	children: (NestedCollectionNode | FieldNode)[];
	query: Query;
	fieldKey: string;
	relation: Relation;
	parentKey: string;
};

export type NestedCollectionNode = M2ONode | O2MNode;

export type FieldNode = {
	type: 'field';
	name: string;
};

export type AST = {
	type: 'root';
	name: string;
	children: (NestedCollectionNode | FieldNode)[];
	query: Query;
};
