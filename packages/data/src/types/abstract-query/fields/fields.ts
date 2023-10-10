import type { AbstractQueryFieldNodeFn } from './function.js';
import type { AbstractQueryFieldNodeNestedMany, AbstractQueryFieldNodeNestedOne } from './nested.js';
import type { AbstractQueryFieldNodePrimitive } from './primitive.js';

export type AbstractQueryFieldNode =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeNestedMany
	| AbstractQueryFieldNodeNestedOne;
