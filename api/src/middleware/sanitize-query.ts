/**
 * Sanitize query parameters.
 * This ensures that query params are formatted and ready to go for the services.
 */

import type { RequestHandler } from 'express';
import { sanitizeQuery } from '../utils/sanitize-query.js';
import { validateQuery } from '../utils/validate-query.js';

const sanitizeQueryMiddleware: RequestHandler = (req, _res, next) => {
	req.sanitizedQuery = {};
	if (!req.query) return;

	req.sanitizedQuery = sanitizeQuery(
		{
			fields: req.query['fields'] || '*',
			...req.query,
		},
		req.accountability || null,
	);

	Object.freeze(req.sanitizedQuery);

	validateQuery(req.sanitizedQuery);

	return next();
};

export default sanitizeQueryMiddleware;
