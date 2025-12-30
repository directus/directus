import asyncHandler from '../utils/async-handler.js';
import { getSchema } from '../utils/get-schema.js';
import type { RequestHandler } from 'express';

const schema: RequestHandler = asyncHandler(async (req, _res, next) => {
	req.schema = await getSchema();
	return next();
});

export default schema;
