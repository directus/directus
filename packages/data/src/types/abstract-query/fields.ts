import type { AbstractQueryFieldNodePrimitive } from './fields/primitive.js';
import type { AbstractQueryFieldNodeFn } from './fields/function.js';
import type { AbstractQueryFieldNodeJson } from './fields/json.js';
import type {
	AbstractQueryFieldNodeNestedSingleMany,
	AbstractQueryFieldNodeNestedSingleOne,
	AbstractQueryFieldNodeNestedUnionMany,
	AbstractQueryFieldNodeNestedUnionOne,
} from './fields/nested.js';

export type AbstractQueryFieldNode =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeJson
	| AbstractQueryFieldNodeNestedSingleMany
	| AbstractQueryFieldNodeNestedSingleOne
	| AbstractQueryFieldNodeNestedUnionMany
	| AbstractQueryFieldNodeNestedUnionOne;
