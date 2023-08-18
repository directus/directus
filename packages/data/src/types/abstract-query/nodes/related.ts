/**
 * This file will be split up into multiple files soon.
 */
import type { AbstractQueryModifiers } from '../modifiers/modifiers.js';
import type { AbstractQueryFieldNodePrimitive } from './primitive.js';
import type { AbstractQueryFieldNodeFn } from './function.js';

/**
 * This is a basic interface for all relational field types.
 */
export interface AbstractQueryFieldNodeRelatedBase {
	// @todo rethink the blow. why a primitive here although it should be a related node?
	nodes: (AbstractQueryFieldNodePrimitive | AbstractQueryFieldNodeFn | AbstractQueryFieldNodeRelated)[];

	/** Regardless of the type of the relationship, it always possible to add modifiers to the foreign collection to adjust the results. */
	modifiers?: AbstractQueryModifiers;

	alias: string;
}

/**
 * With those Used to build a relational query for m2o and o2m relations.
 */
export type AbstractQueryFieldNodeRelated =
	| AbstractQueryFieldNodeRelatedManyToOne
	| AbstractQueryFieldNodeRelatedOneToMany
	| AbstractQueryFieldNodeRelatedAnyToOne
	| AbstractQueryFieldNodeRelatedOneToAny;

/**
 * Used to build a relational query for m2o and o2m relations.
 * @example
 * ```
 * const functionNode = {
 * 	current: {
 * 		fields: ['id']
 *  },
 * 	external: {
 * 		store: 'mongodb',
 * 		collection: 'some-collection',
 * }
 * ```
 */
export interface AbstractQueryFieldNodeRelatedJoinMany {
	/** the field of the current collection which has the relational value to an external collection or item */
	current: {
		fields: [string, ...string[]];
	};

	/** the external collection or item which should be pulled/joined/merged into the current collection */
	external: {
		store?: string;
		collection: string;
		fields: [string, ...string[]];
	};
}

export interface AbstractQueryFieldNodeRelatedJoinAny {
	current: {
		collectionField: string;
		fields: [string, ...string[]];
	};

	external: {
		store?: string;
		fields: [string, ...string[]];
	};
}

export interface AbstractQueryFieldNodeRelatedManyToOne extends AbstractQueryFieldNodeRelatedBase {
	type: 'm2o';

	join: AbstractQueryFieldNodeRelatedJoinMany;
}

export interface AbstractQueryFieldNodeRelatedOneToMany extends AbstractQueryFieldNodeRelatedBase {
	type: 'o2m';
	// maybe every here
	join: AbstractQueryFieldNodeRelatedJoinMany;
}

export interface AbstractQueryFieldNodeRelatedAnyToOne extends AbstractQueryFieldNodeRelatedBase {
	type: 'a2o';

	join: AbstractQueryFieldNodeRelatedJoinAny;
}

export interface AbstractQueryFieldNodeRelatedOneToAny extends AbstractQueryFieldNodeRelatedBase {
	type: 'o2a';

	join: AbstractQueryFieldNodeRelatedJoinAny;
}

/**
 * Continue on it after relationships
 * @deprecated Those information will probably go within the o2m relational node
 **/
export interface AbstractQueryQuantifierNode {
	type: 'quantifier';
	operator: 'every' | 'some';

	/** The o2m field that the every/some should be applied on */
	target: AbstractQueryFieldNodeRelatedOneToMany | AbstractQueryFieldNodeRelatedOneToAny;

	/** An alias to reference the o2m item */
	alias: string;

	/** the values for the the operation. */
	// childNode: AbstractQueryConditionNode | AbstractQueryNodeLogical | AbstractQueryNodeNegate;
}
