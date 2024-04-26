import asyncHandler from '../utils/async-handler.js';
import { getSchema } from '../utils/get-schema.js';

const schemaMiddleware = asyncHandler(async (req, _res, next) => {
	req.schema = await getSchema();
	return next();
});

export default schemaMiddleware;
