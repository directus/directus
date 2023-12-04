import type { AtLeastOneElement } from '../../../misc.js';
import type { AbstractQueryFieldNode } from '../../fields.js';

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
export interface AbstractQueryFieldNodeNestedRelationalMany {
	type: 'relational-many';

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

/**
 * Used to build a relational query for a2o and o2a relations.
 */
export interface AbstractQueryFieldNodeNestedRelationalAny {
	type: 'relational-any';

	/** The field name which holds the relational information */
	field: string;

	collections: AbstractQueryFieldNodeNestedRelationalAnyCollection[];
}

interface AbstractQueryFieldNodeNestedRelationalAnyCollection {
	/** The desired fields which should be returned. */
	fields: AbstractQueryFieldNode[];

	/** The relational data which defines how the two collection are related. */
	relational: {
		store: string;

		/** The name of the foreign collection */
		collectionName: string;

		/** The UUID of the foreign collection */
		collectionIdentifier: string;

		/** The column(s) of the foreign collection which store the primary key(s) */
		fields: AtLeastOneElement<string>;
	};
}
