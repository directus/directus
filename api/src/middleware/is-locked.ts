import { ResourceRestrictedError } from '@directus/errors';
import type { NextFunction, Request, Response } from 'express';
import type { RequestHandler } from 'express-serve-static-core';
import { getLicenseManager } from '../license/manager.js';
import asyncHandler from '../utils/async-handler.js';

/**
 * Throws an error if the license is in a locked state
 */
export const handler = (resource: string): RequestHandler =>
	asyncHandler(async (_req: Request, _res: Response, next: NextFunction) => {
		if (await getLicenseManager().isLocked()) {
			throw new ResourceRestrictedError({
				category: resource,
			});
		}

		return next();
	});

export default handler;
