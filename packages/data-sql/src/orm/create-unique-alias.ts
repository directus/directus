import { randomBytes } from 'node:crypto';

/**
 * Appends a pseudo-random value to the end of a given identifier to make sure it's unique within the
 * context of the current query. The generated identifier is used as an alias to select columns and to join tables.
 *
 * @remarks
 * The uniqueness of a table or column within the schema is not enough for us, since f.e. the same table can be joined multiple times
 * and only with some randomness added, we can ensure that the ORM does the nesting correctly.
 *
 * @todo OracleDB has a max length of 30 characters for identifiers. Is this the right spot to
 * ensure that, or should that be on the DB level?
 */
export const createUniqueAlias = (identifier: string) => {
	const random = randomBytes(3).toString('hex');
	return `${identifier}_${random}`;
};
