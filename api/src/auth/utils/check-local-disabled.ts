import { useEnv } from '@directus/env';
import { RouteNotFoundError } from '@directus/errors';
import type { RequestHandler } from 'express';
import { getEntitlementManager } from '../../license/index.js';
import asyncHandler from '../../utils/async-handler.js';

export const checkLocalAuthDisabled: RequestHandler = asyncHandler(async (req, _res, next) => {
	const { AUTH_DISABLE_DEFAULT } = useEnv();

	if (getEntitlementManager().isEntitled('sso_enabled') && AUTH_DISABLE_DEFAULT) {
		throw new RouteNotFoundError({ path: req.path });
	}

	return next();
});
