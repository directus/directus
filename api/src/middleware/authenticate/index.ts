import { useEnv } from '@directus/env';
import { ErrorCode, isDirectusError } from '@directus/errors';
import { SESSION_COOKIE_OPTIONS } from '../../constants.js';
import asyncHandler from '../../utils/async-handler.js';
import { extractToken } from './extract-token.js';
import { getAccountability } from './get-accountability.js';

/**
 * Verify the token and assign the accountability to the request.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
	const { token, source } = extractToken(req);

	req.token = token;

	try {
		req.accountability = await getAccountability(req, token);
	} catch (error) {
		// Clear the session cookie if the provided token is invalid,
		// allowing the client to login again
		if (isDirectusError(error, ErrorCode.InvalidToken) && source === 'cookie') {
			const env = useEnv();
			res.clearCookie(env['SESSION_COOKIE_NAME'] as string, SESSION_COOKIE_OPTIONS);
		}

		throw error;
	}

	return next();
});
