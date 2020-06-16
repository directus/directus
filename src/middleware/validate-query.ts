/**
 * Validates query parameters.
 * We'll check if all fields you're trying to access exist
 *
 * This has to be run after sanitizeQuery
 */

import { RequestHandler } from 'express';
import { Query } from '../types/query';
import { hasField } from '../services/schema';
import asyncHandler from 'express-async-handler';
import APIError, { ErrorCode } from '../error';

const validateQuery: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!res.locals.collection) return next();
	if (!res.locals.query) return next();

	const query: Query = res.locals.query;

	const fieldsToCheck = new Set<string>();

	if (query.fields) {
		query.fields.forEach((field) => fieldsToCheck.add(field));
	}

	try {
		await Promise.all(
			Array.from(fieldsToCheck).map(
				(field) =>
					new Promise(async (resolve, reject) => {
						const exists = await hasField(res.locals.collection, field);
						if (exists) return resolve();
						return reject({ collection: res.locals.collection, field: field });
					})
			)
		);
	} catch ({ collection, field }) {
		throw new APIError(
			ErrorCode.FIELD_NOT_FOUND,
			`Field "${field}" doesn't exist in "${collection}"`
		);
	}

	return next();
});

export default validateQuery;
