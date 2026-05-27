import { RouteNotFoundError } from '@directus/errors';
import type { RequestHandler } from 'express';
import { getEntitlementManager } from '../../license/index.js';
import { isSsoBypassAllowed } from '../../license/utils/is-sso-bypass-allowed.js';
import asyncHandler from '../../utils/async-handler.js';

export const checkSsoEnabled: RequestHandler = asyncHandler(async (req, _res, next) => {
	const ssoAvailable = getEntitlementManager().isEntitled('sso_enabled') || (await isSsoBypassAllowed());

	if (!ssoAvailable) {
		throw new RouteNotFoundError({ path: req.path });
	}

	return next();
});
