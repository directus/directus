/**
 * Set req.collection for use in other middleware. Used as an alternative on validate-collection for
 * system collections
 */
import type { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler.js';

const useCollection = (collection: string): RequestHandler =>
	asyncHandler(async (req, _res, next) => {
		req.collection = collection;
		next();
	});

export default useCollection;
