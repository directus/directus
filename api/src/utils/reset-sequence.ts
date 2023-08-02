import type { Request } from 'express';
import { getHelpers } from '../database/helpers/index.js';
import getDatabase from '../database/index.js';
import logger from '../logger.js';

/**
 * Checks if the primary key was provided in the request and
 * resets the auto_increment sequence of the table to which have been stored if a primary key was provided.
 *
 * @param req - the request object
 */
export const resetSequenceIfNeeded = async (req: Request) => {
	const primaryKeyField = req.schema.collections[req.collection]!.primary;
	const pkValueWasProvided = pkWasProvided(req.body, primaryKeyField);

	if (pkValueWasProvided) {
		const db = getDatabase();

		try {
			await getHelpers(db).sequence.resetAutoIncrementSequence(req.collection, 'id');
		} catch (err) {
			logger.warn(`Couldn't reset auto_increment sequence: ${err}`);
		}
	}
};

/**
 * Checks if the primary key was manually provided.
 *
 * @param body - the request body, can be one or multiple items
 * @param pkFieldName - the name of the primary field
 * @returns true if the primary key was provided, false otherwise
 */
export function pkWasProvided(body: any, pkFieldName: string): boolean {
	if (Array.isArray(body)) {
		return body.some((item) => item[pkFieldName] !== undefined);
	} else {
		return body[pkFieldName] !== undefined;
	}
}
