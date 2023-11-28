import type { AbstractQueryFieldNodeFn } from './fields/function.js';
import type { AbstractQueryFieldNodeNestedMany, AbstractQueryFieldNodeNestedOne } from './fields/nested.js';
import type { AbstractQueryFieldNodePrimitive } from './fields/primitive.js';

export type AbstractQueryFieldNode =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeNestedMany
	| AbstractQueryFieldNodeNestedOne;
