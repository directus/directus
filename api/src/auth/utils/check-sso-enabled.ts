import { RouteNotFoundError } from '@directus/errors';
import type { RequestHandler } from 'express';
import { getEntitlementManager } from '../../license/index.js';
import { getLicenseManager } from '../../license/manager.js';
import { isInCoreGracePeriod } from '../../license/utils/is-in-core-grace-period.js';
import asyncHandler from '../../utils/async-handler.js';

export const checkSsoEnabled: RequestHandler = asyncHandler(async (req, _res, next) => {
	// Keep SSO reachable when not entitled if the license is locked or in the v12 grace
	// period. Allows admins to still sign in and resolve SSO.
	const ssoAvailable =
		getEntitlementManager().isEntitled('sso_enabled') ||
		(await getLicenseManager().isLocked()) ||
		(await isInCoreGracePeriod());

	if (!ssoAvailable) {
		throw new RouteNotFoundError({ path: req.path });
	}

	return next();
});
