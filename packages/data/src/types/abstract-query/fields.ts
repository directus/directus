import type { AbstractQueryFieldNodePrimitive } from './fields/primitive.js';
import type { AbstractQueryFieldNodeFn } from './fields/function.js';
import type {
	AbstractQueryFieldNodeNestedSingleMany,
	AbstractQueryFieldNodeNestedSingleOne,
	AbstractQueryFieldNodeNestedUnionMany,
	AbstractQueryFieldNodeNestedUnionOne,
} from './fields/nested.js';

export type AbstractQueryFieldNode =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeNestedSingleMany
	| AbstractQueryFieldNodeNestedSingleOne
	| AbstractQueryFieldNodeNestedUnionMany
	| AbstractQueryFieldNodeNestedUnionOne;
