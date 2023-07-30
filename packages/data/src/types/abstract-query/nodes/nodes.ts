import type { AbstractQueryFieldNodeFn } from './function.js';
import type { AbstractQueryFieldNodePrimitive } from './primitive.js';
import type { AbstractQueryFieldNodeRelated } from './related.js';

/**
 * A group of all possible field types.
 * This can be used within the `nodes` array of the `AbstractQuery`.
 */
export type AbstractQueryFieldNode =
	| AbstractQueryFieldNodePrimitive
	| AbstractQueryFieldNodeFn
	| AbstractQueryFieldNodeRelated;
