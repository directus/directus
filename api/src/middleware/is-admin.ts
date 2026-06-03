import { ForbiddenError } from '@directus/errors';
import type { NextFunction, Request, Response } from 'express';
import asyncHandler from '../utils/async-handler.js';
import { isAdmin } from '../utils/is-admin.js';

/**
 * Require the request to have been  made by an admin
 */
export const handler = async (req: Request, _res: Response, next: NextFunction) => {
	if (!isAdmin(req.accountability)) {
		throw new ForbiddenError();
	}

	return next();
};

export default asyncHandler(handler);
