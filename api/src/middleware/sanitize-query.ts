/**
 * Sanitize query parameters.
 * This ensures that query params are formatted and ready to go for the services.
 */

import { RequestHandler } from 'express';
import { sanitizeQuery } from '../utils/sanitize-query';
import { validateQuery } from '../utils/validate-query';

const sanitizeQueryMiddleware: RequestHandler = (req, res, next) => {
	req.sanitizedQuery = {};
	if (!req.query) return;

	req.sanitizedQuery = sanitizeQuery(
		{
			fields: req.query.fields || '*',
			...req.query,
		},
		req.accountability || null
	);

	Object.freeze(req.sanitizedQuery);

	validateQuery(req.sanitizedQuery);

	return next();
};

export default sanitizeQueryMiddleware;
