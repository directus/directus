import type { AbstractQueryFieldNodePrimitive } from './primitive.js';
import type { AbstractQueryFieldNodeFn } from './function.js';
import type { AbstractQueryFieldNodeRelated } from './related.js';

export type AbstractQueryFieldNode =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeRelated;
