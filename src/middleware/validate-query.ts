/**
 * Validates query parameters.
 * We'll check if all fields you're trying to access exist
 *
 * This has to be run after sanitizeQuery
 */

import { RequestHandler } from 'express';
import { Query } from '../types/query';
import { hasFields } from '../services/schema';
import asyncHandler from 'express-async-handler';
import APIError, { ErrorCode } from '../error';

const validateQuery: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!req.params.collection) return next();
	if (!res.locals.query) return next();

	const query: Query = res.locals.query;

	await validateParams(req.params.collection, query);
	await validateFields(req.params.collection, query);

	return next();
});

async function validateParams(collection: string, query: Query) {
	if (query.offset && query.page) {
		throw new APIError(
			ErrorCode.INVALID_QUERY,
			`You can't have both the offset and page query parameters enabled.`
		);
	}
}

async function validateFields(collection: string, query: Query) {
	const fieldsToCheck = new Set<string>();

	if (query.fields) {
		query.fields.forEach((field) => fieldsToCheck.add(field));
	}

	if (query.sort) {
		query.sort.forEach((sort) => fieldsToCheck.add(sort.column));
	}

	const fieldsExist = await hasFields(collection, Array.from(fieldsToCheck));

	Array.from(fieldsToCheck).forEach((field, index) => {
		const exists = fieldsExist[index];
		if (exists === false)
			throw new APIError(
				ErrorCode.FIELD_NOT_FOUND,
				`Field ${field} doesn't exist in ${collection}.`
			);
	});
}

export default validateQuery;
