import asyncHandler from '../utils/async-handler.js';
import { getSchema } from '../utils/get-schema.js';

export const schema = asyncHandler(async (req, _res, next) => {
	req.schema = await getSchema();

	return next();
});
