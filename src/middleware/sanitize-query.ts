/**
 * Sanitize query parameters.
 * This ensures that query params are formatted and ready to go for the services.
 */

import { RequestHandler } from 'express';
import { Query } from '../types/query';
import logger from '../logger';

const sanitizeQuery: RequestHandler = (req, res, next) => {
	if (!req.query) return;

	const query: Query = {};

	if (req.query.fields) {
		query.fields = sanitizeFields(req.query.fields);
	}

	res.locals.query = query;
	return next();
};

export default sanitizeQuery;

function sanitizeFields(rawFields: any) {
	let fields: string[] = [];

	if (typeof rawFields === 'string') fields = rawFields.split(',');
	else if (Array.isArray(rawFields)) fields = rawFields as string[];

	return fields;
}
