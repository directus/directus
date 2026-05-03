import { useEnv } from "@directus/env";
import { RouteNotFoundError } from "@directus/errors";
import { toBoolean } from "@directus/utils";
import type { RequestHandler } from "express";
import { entitlementManager } from "../../license/entitlements/manager.js";
import asyncHandler from "../../utils/async-handler.js";

export const checkLocalAuthDisabled: RequestHandler = asyncHandler(async (req, _res, next) => {
	const env = useEnv();
	const sso_allowed = entitlementManager.isEntitled('sso_enabled');

	if (sso_allowed === true && toBoolean(env['AUTH_DISABLE_DEFAULT'])) {
		throw new RouteNotFoundError({ path: req.path });
  	}

	return next();
});