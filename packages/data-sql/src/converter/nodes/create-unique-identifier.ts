import { randomBytes } from 'node:crypto';

/**
 * Appends a pseudo-random value to the end of a given identifier to make sure it's unique within the
 * context of the current query.
 *
 * @todo OracleDB has a max length of 30 characters for identifiers. Is this the right spot to
 * ensure that, or should that be on the DB level?
 */
export const createUniqueIdentifier = (identifier: string) => {
	const random = randomBytes(3).toString('hex');
	return `${identifier}_${random}`;
};
