import type { AbstractQueryFieldNodeFn } from './fields/function.js';
import type {
	AbstractQueryFieldNodeNestedMany,
	AbstractQueryFieldNodeNestedOne,
	AbstractQueryFieldNodeNestedTarget,
} from './fields/nested.js';
import type { AbstractQueryFieldNodePrimitive } from './fields/primitive.js';

export type AbstractQueryFieldNode =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeNestedMany
	| AbstractQueryFieldNodeNestedOne;

export type AbstractQueryFieldNodeTarget =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeNestedTarget;
