import { RouteNotFoundError } from '@directus/errors';
import type { RequestHandler } from 'express';
import { isSsoEscapeHatchActive } from '../../license/utils/is-sso-escape-hatch-active.js';
import asyncHandler from '../../utils/async-handler.js';

export const checkSsoEnabled: RequestHandler = asyncHandler(async (req, _res, next) => {
	if (!(await isSsoEscapeHatchActive())) {
		throw new RouteNotFoundError({ path: req.path });
	}

	return next();
});
