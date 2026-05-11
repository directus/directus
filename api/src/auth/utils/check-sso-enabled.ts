import { RouteNotFoundError } from '@directus/errors';
import type { RequestHandler } from 'express';
import { getEntitlementManager } from '../../license/index.js';
import asyncHandler from '../../utils/async-handler.js';

export const checkSsoEnabled: RequestHandler = asyncHandler(async (req, _res, next) => {
	if (!getEntitlementManager().isEntitled('sso_enabled')) {
		throw new RouteNotFoundError({ path: req.path });
	}

	return next();
});
