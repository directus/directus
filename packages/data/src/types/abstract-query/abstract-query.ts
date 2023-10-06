/**
 * The query can be seen as a tree with various nodes.
 * Each node has a type and different attributes.
 *
 * @module abstract-query
 */
import type { AbstractQueryModifiers } from './modifiers/index.js';
import type { AbstractQueryFieldNode } from './fields/fieldNodes.js';

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

	/** All fields to select in the query*/
	fields: AbstractQueryFieldNode[];

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
export * from './fields/function.js';
export * from './fields/primitive.js';
export * from './fields/related.js';
export * from './fields/fieldNodes.js';
