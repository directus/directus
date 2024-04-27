import asyncHandler from '../utils/async-handler.js';
import { getPermissions as getPermissionsUtil } from '../utils/get-permissions.js';

export const getPermissions = asyncHandler(async (req, _res, next) => {
	const accountability = req.accountability!;

	accountability.permissions = await getPermissionsUtil(accountability, req.schema);

	return next();
});
