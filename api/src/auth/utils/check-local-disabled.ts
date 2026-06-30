import { useEnv } from '@directus/env';
import { RouteNotFoundError } from '@directus/errors';
import { toBoolean } from '@directus/utils';
import type { RequestHandler } from 'express';
import { getEntitlementManager } from '../../license/index.js';
import asyncHandler from '../../utils/async-handler.js';

export const checkLocalAuthDisabled: RequestHandler = asyncHandler(async (req, _res, next) => {
	const env = useEnv();

	if (getEntitlementManager().isEntitled('sso_enabled') && toBoolean(env['AUTH_DISABLE_DEFAULT'])) {
		throw new RouteNotFoundError({ path: req.path });
	}

	return next();
});
