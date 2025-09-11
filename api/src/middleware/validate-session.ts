import { InvalidOtpError } from '@directus/errors';
import type { NextFunction, Request, Response } from 'express';
import { PENDING_OTP_POSTFIX } from '../constants.js';
import asyncHandler from '../utils/async-handler.js';

/**
 * Error out on sessions that are pending OTP verification
 */
export const handler = async (req: Request, _res: Response, next: NextFunction) => {
	const allowedPaths = ['/auth', '/server/info'];
	const allowedPrefixes = ['/auth/'];

	if (
		req.accountability?.session?.endsWith(PENDING_OTP_POSTFIX) &&
		allowedPaths.every((path) => req.path !== path) &&
		allowedPrefixes.every((prefix) => !req.path.startsWith(prefix))
	) {
		throw new InvalidOtpError();
	}

	return next();
};

export default asyncHandler(handler);
