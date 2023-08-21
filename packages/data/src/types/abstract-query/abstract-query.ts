/**
 * The query can be seen as a tree with various nodes.
 * Each node has a type and different attributes.
 *
 * @module abstract-query
 */
import type { AbstractQueryModifiers } from './modifiers/index.js';
import type { AbstractQueryFieldNodeFn } from './nodes/function.js';
import type { AbstractQueryFieldNodePrimitive } from './nodes/primitive.js';
import type { AbstractQueryFieldNodeRelated } from './nodes/related.js';

/**
 * The abstract root query
 */
export interface AbstractQuery {
	/** Marked as entrypoint of the query */
	root: boolean;

	/** Location where the data is stored */
	store: string;

	/** Name of the collection entrypoint within the store */
	collection: string;

	/** All fields to select in the query */
	nodes: (AbstractQueryFieldNodePrimitive | AbstractQueryFieldNodeFn | AbstractQueryFieldNodeRelated)[];

	/** Optional attributes to perform a fine granular query */
	modifiers?: AbstractQueryModifiers;
}

// disabled for now: it might be redundant
// type AbstractQueryNodeType = 'primitive' | 'fn' | 'm2o' | 'o2m' | 'a2o' | 'o2a';

/**
 * @TODO
 * - Rethink every / some
 */

export * from './modifiers/index.js';
export * from './nodes/function.js';
export * from './nodes/primitive.js';
export * from './nodes/related.js';
