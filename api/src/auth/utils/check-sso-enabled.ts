import { RouteNotFoundError } from '@directus/errors';
import type { RequestHandler } from 'express';
import { getEntitlementManager } from '../../license/index.js';
import asyncHandler from '../../utils/async-handler.js';

export const checkSsoEnabled: RequestHandler = asyncHandler(async (req, _res, next) => {
	const entitlementManager = getEntitlementManager();
	const sso_allowed = entitlementManager.isEntitled('sso_enabled');

	if (sso_allowed === false) {
		throw new RouteNotFoundError({ path: req.path });
	}

	return next();
});
