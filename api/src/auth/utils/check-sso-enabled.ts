import { RouteNotFoundError } from '@directus/errors';
import type { RequestHandler } from 'express';
import { getEntitlementManager } from '../../license/index.js';
import { getLicenseManager } from '../../license/manager.js';
import asyncHandler from '../../utils/async-handler.js';

export const checkSsoEnabled: RequestHandler = asyncHandler(async (req, _res, next) => {
	// Lockout escape hatch: when the license is locked, keep SSO routes open so admins on
	// a non-default provider can still sign in and set a default-provider password before
	// SSO is fully disabled.
	if (!getEntitlementManager().isEntitled('sso_enabled') && !(await getLicenseManager().isLocked())) {
		throw new RouteNotFoundError({ path: req.path });
	}

	return next();
});
