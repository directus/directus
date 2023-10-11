/**
 * The query can be seen as a tree with various nodes.
 * Each node has a type and different attributes.
 *
 * @module abstract-query
 */
import type { AbstractQueryFieldNode } from './abstract-query/fields.js';
import type { AbstractQueryModifiers } from './abstract-query/modifiers.js';

/**
 * The abstract root query
 */
export interface AbstractQuery {
	/** Location where the data is stored */
	store: string;

	/** Name of the collection entrypoint within the store */
	collection: string;

	/** All fields to select in the query*/
	fields: AbstractQueryFieldNode[];

	/** Optional attributes to perform a fine granular query */
	modifiers?: AbstractQueryModifiers;
}
