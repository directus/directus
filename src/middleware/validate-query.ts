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
import { InvalidQueryException } from '../exceptions';

const validateQuery: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!req.collection) return next();
	if (!req.query) return next();

	const query: Query = req.query;

	await Promise.all([
		validateParams(req.params.collection, query),
		validateFields(req.params.collection, query),
		validateMeta(query),
	]);

	return next();
});

async function validateParams(collection: string, query: Query) {
	if (query.offset && query.page) {
		throw new InvalidQueryException(
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
			throw new InvalidQueryException(`Field ${field} doesn't exist in ${collection}.`);
	});
}

async function validateMeta(query: Query) {
	if (!query.meta) return;

	return query.meta.every((metaField) => []);
}

export default validateQuery;
