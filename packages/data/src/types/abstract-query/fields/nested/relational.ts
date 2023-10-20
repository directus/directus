import type { AtLeastOneElement } from '../../../misc.js';

/**
 * Used to build a relational query for m2o and a2o relations.
 */
export type AbstractQueryFieldNodeNestedRelationalOne =
	| AbstractQueryFieldNodeRelationalManyToOne
	| AbstractQueryFieldNodeRelationalAnyToOne;

/**
 * Used to build a relational query for o2m and o2a relations.
 */
export type AbstractQueryFieldNodeNestedRelationalMany =
	| AbstractQueryFieldNodeRelationalOneToMany
	| AbstractQueryFieldNodeRelationalOneToAny;

export interface AbstractQueryFieldNodeRelationalManyToOne {
	type: 'm2o';

	join: AbstractQueryFieldNodeRelationalJoinMany;
}

export interface AbstractQueryFieldNodeRelationalOneToMany {
	type: 'o2m';

	/*
	 * as a reminder: the o2m relational type does noy have anything stored on the o side,
	 * the relational keys live in the related collection
	 */

	internalIdentifierFields: AtLeastOneElement<string>;

	external: {
		store: string;
		collection: string;
		fields: AtLeastOneElement<string>;
	};
}

export interface AbstractQueryFieldNodeRelationalAnyToOne {
	type: 'a2o';

	join: AbstractQueryFieldNodeRelationalJoinAny;
}

export interface AbstractQueryFieldNodeRelationalOneToAny {
	type: 'o2a';

	join: AbstractQueryFieldNodeRelationalJoinAny;
}

/**
 * Used to build a relational query for m2o and o2m relations.
 * @example
 * ```
 * const functionNode = {
 * 	internal: {
 * 		fields: ['id']
 *  },
 * 	external: {
 * 		store: 'mongodb',
 * 		collection: 'some-collection',
 * }
 * ```
 */
export interface AbstractQueryFieldNodeRelationalJoinMany {
	/** the fields of the current collection which have the relational value to an external collection or item */
	internal: {
		fields: AtLeastOneElement<string>;
	};

	/** the external collection or item which should be pulled/joined/merged into the current collection */
	external: {
		store: string;
		collection: string;
		fields: AtLeastOneElement<string>;
	};
}

export interface AbstractQueryFieldNodeRelationalJoinAny {
	internal: {
		collectionField: string;
		fields: AtLeastOneElement<string>;
	};

	external: {
		store: string;
		fields: AtLeastOneElement<string>;
	};
}
