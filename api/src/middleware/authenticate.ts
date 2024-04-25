import { useEnv } from '@directus/env';
import { ErrorCode, isDirectusError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import type { NextFunction, Request, Response } from 'express';
import { isEqual } from 'lodash-es';
import { SESSION_COOKIE_OPTIONS } from '../constants.js';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import asyncHandler from '../utils/async-handler.js';
import { getAccountabilityForToken } from '../utils/get-accountability-for-token.js';
import { getIPFromReq } from '../utils/get-ip-from-req.js';

/**
 * Verify the passed JWT and assign the user ID and role to `req`
 */
export const handler = async (req: Request, res: Response, next: NextFunction) => {
	const defaultAccountability: Accountability = {
		user: null,
		role: null,
		admin: false,
		app: false,
		ip: getIPFromReq(req),
	};

	const userAgent = req.get('user-agent')?.substring(0, 1024);
	if (userAgent) defaultAccountability.userAgent = userAgent;

	const origin = req.get('origin');
	if (origin) defaultAccountability.origin = origin;

	const database = getDatabase();

	const customAccountability = await emitter.emitFilter(
		'authenticate',
		defaultAccountability,
		{
			req,
		},
		{
			database,
			schema: null,
			accountability: null,
		},
	);

	if (customAccountability && isEqual(customAccountability, defaultAccountability) === false) {
		req.accountability = customAccountability;
		return next();
	}

	try {
		req.accountability = await getAccountabilityForToken(req.token, defaultAccountability);
	} catch (error) {
		// Clear the session cookie if the provided token is invalid,
		// allowing the client to login again
		if (isDirectusError(error, ErrorCode.InvalidToken) && req.tokenSource === 'cookie') {
			const env = useEnv();
			res.clearCookie(env['SESSION_COOKIE_NAME'] as string, SESSION_COOKIE_OPTIONS);
		}

		throw error;
	}

	return next();
};

export default asyncHandler(handler);
