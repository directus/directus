import type { AbstractQueryFieldNodePrimitive } from './primitive.js';
import type { AbstractQueryFieldNodeFn } from './function.js';
import type { AbstractQueryFieldNodeRelatedJoinAny } from './related.js';

export type AbstractQueryFieldNode =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeRelatedJoinAny;
