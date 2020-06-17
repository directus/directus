/**
 * Validates query parameters.
 * We'll check if all fields you're trying to access exist
 *
 * This has to be run after sanitizeQuery
 */

import { RequestHandler } from 'express';
import { Query } from '../types/query';
import { hasField, hasFields } from '../services/schema';
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

	const fieldsExist = await hasFields(res.locals.collection, Array.from(fieldsToCheck));

	Array.from(fieldsToCheck).forEach((field, index) => {
		const exists = fieldsExist[index];
		if (exists === false)
			throw new APIError(
				ErrorCode.FIELD_NOT_FOUND,
				`Field ${field} doesn't exist in ${res.locals.collection}.`
			);
	});

	return next();
});

export default validateQuery;
