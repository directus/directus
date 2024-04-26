import type { RequestHandler } from 'express';

/**
 * Set req.collection for use in other middleware. Used as an alternative on validate-collection for
 * system collections.
 */
const useCollectionMiddleware =
	(collection: string): RequestHandler =>
	(req, _res, next) => {
		req.collection = collection;
		return next();
	};

export default useCollectionMiddleware;
