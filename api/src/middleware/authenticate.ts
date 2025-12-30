import { SESSION_COOKIE_OPTIONS } from '../constants.js';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { createDefaultAccountability } from '../permissions/utils/create-default-accountability.js';
import asyncHandler from '../utils/async-handler.js';
import { getAccountabilityForToken } from '../utils/get-accountability-for-token.js';
import { getIPFromReq } from '../utils/get-ip-from-req.js';
import { useEnv } from '@directus/env';
import { ErrorCode, isDirectusError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import type { NextFunction, Request, Response } from 'express';
import { isEqual } from 'lodash-es';

/**
 * Verify the passed JWT and assign the user ID and role to `req`
 */
export const handler = async (req: Request, res: Response, next: NextFunction) => {
	const env = useEnv();

	const defaultAccountability: Accountability = createDefaultAccountability({ ip: getIPFromReq(req) });

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
	} catch (err) {
		if (isDirectusError(err, ErrorCode.InvalidCredentials) || isDirectusError(err, ErrorCode.InvalidToken)) {
			if (req.cookies[env['SESSION_COOKIE_NAME'] as string] === req.token) {
				// clear the session token if ended up in an invalid state
				res.clearCookie(env['SESSION_COOKIE_NAME'] as string, SESSION_COOKIE_OPTIONS);
			}
		}

		throw err;
	}

	return next();
};

export default asyncHandler(handler);
