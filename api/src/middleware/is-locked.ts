import { ServiceUnavailableError } from '@directus/errors';
import type { NextFunction, Request, Response } from 'express';
import { getLicenseManager } from '../license/manager.js';
import asyncHandler from '../utils/async-handler.js';

/**
 * Throws an error if the license is in a locked state
 */
export const handler = async (_req: Request, _res: Response, next: NextFunction) => {
	if (await getLicenseManager().isLocked()) {
		// LICENSE-TODO: Convert to a dedicated PROJECT_LOCKED?
		throw new ServiceUnavailableError({
			reason: 'License is in a locked state and must be resolved',
			service: 'license',
		});
	}

	return next();
};

export default asyncHandler(handler);
