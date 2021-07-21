/**
 * Set req.collection for use in other middleware. Used as an alternative on validate-collection for
 * system collections
 */
import { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';

const useCollection = (collection: string): RequestHandler =>
	asyncHandler(async (req, res, next) => {
		req.collection = collection;
		next();
	});

export default useCollection;
