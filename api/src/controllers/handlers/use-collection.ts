import type { RequestHandler } from 'express';

/**
 * Set `req.collection` for use in other middleware.
 * Used as an alternative on validate-collection for
 * system collections.
 */
export const useCollection =
	(collection: string): RequestHandler =>
	(req, _res, next) => {
		req.collection = collection;

		return next();
	};
