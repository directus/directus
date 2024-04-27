import type { RequestHandler } from 'express';
import { sanitizeQuery as sanitizedQueryUtil } from '../utils/sanitize-query.js';
import { validateQuery } from '../utils/validate-query.js';

/**
 * Sanitize query parameters.
 * This ensures that query params are formatted and ready to go for the services.
 */
export const sanitizeQuery: RequestHandler = (req, _res, next) => {
	req.sanitizedQuery = sanitizedQueryUtil(
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
