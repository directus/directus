/**
 * Set req.collection for use in other middleware. Used as an alternative on validate-collection for
 * system collections
 */
import { NextFunction, Request, Response } from 'express';
import asyncHandler from '../utils/async-handler';

const useCollection = (collection: string) =>
	asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
		req.collection = collection;
		next();
	});

export default useCollection;
