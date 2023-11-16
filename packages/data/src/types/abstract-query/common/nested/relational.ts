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

	join: AbstractQueryFieldNodeRelationalJoinMany;
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
 *
 * A record may be identified across multiple field values (e.g. via a composite primary key in SQL).
 * Hence the field(s) are stored in an array.
 *
 * @example
 * ```
 * const functionNode = {
 * 	local: {
 * 		fields: ['id'],
 *    },
 * 	foreign: {
 * 		store: 'mongodb',
 * 		collection: 'some-collection',
 * 		fields: ['author_id'],
 *    },
 * };
 * ```
 */
export interface AbstractQueryFieldNodeRelationalJoinMany {
	/**
	 * The field names which identify an item in the...
	 *
	 * m2o: MANY collection. It has the references stored to the ONE item (the foreign key in SQL).
	 * o2m: ONE collection. It has the values stored which identifies an item (the primary key in SQL).
	 **/
	local: {
		fields: AtLeastOneElement<string>;
	};

	/**
	 * m2o: information of the ONE collection
	 * o2m: information of the MANY collection
	 **/
	foreign: {
		/** In the future this collection can also be stored in a different datastore. */
		store: string;

		collection: string;

		/**
		 * The field names which identify an item in the...
		 *
		 * m2o: ONE collection.
		 * o2m: MANY collection.
		 **/
		fields: AtLeastOneElement<string>;
	};
}

export interface AbstractQueryFieldNodeRelationalJoinAny {
	local: {
		collectionField: string;
		fields: AtLeastOneElement<string>;
	};

	foreign: {
		store: string;
		fields: AtLeastOneElement<string>;
	};
}
