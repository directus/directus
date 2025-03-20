/**
 * Sanitize query parameters.
 * This ensures that query params are formatted and ready to go for the services.
 */

import type { RequestHandler } from 'express';
import { sanitizeQuery } from '../utils/sanitize-query.js';
import { validateQuery } from '../utils/validate-query.js';

const sanitizeQueryMiddleware: RequestHandler = async (req, _res, next) => {
	req.sanitizedQuery = {};
	if (!req.query) return;

	// Skip sanitization and validation if query is empty
	if (Object.keys(req.query).length === 0) {
		Object.freeze(req.sanitizedQuery);
		return next();
	}

	try {
		req.sanitizedQuery = await sanitizeQuery(
			{
				fields: req.query['fields'] || '*',
				...req.query,
			},
			req.schema,
			req.accountability || null,
		);

		Object.freeze(req.sanitizedQuery);

		validateQuery(req.sanitizedQuery);
	} catch (error) {
		return next(error);
	}

	return next();
};

export default sanitizeQueryMiddleware;
