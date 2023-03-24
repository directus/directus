import type { RequestHandler } from 'express';
import asyncHandler from '../utils/async-handler';
import { getPermissions as getPermissionsUtil } from '../utils/get-permissions';

const getPermissions: RequestHandler = asyncHandler(async (req, res, next) => {
	if (!req.accountability) {
		throw new Error('getPermissions middleware needs to be called after authenticate');
	}

	req.accountability.permissions = await getPermissionsUtil(req.accountability, req.schema);

	return next();
});

export default getPermissions;
