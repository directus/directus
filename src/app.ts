import express from 'express';
import asyncHandler from 'express-async-handler';
import APIError, { errorHandler, ErrorCode } from './error';

const app = express()
	.get(
		'/',
		asyncHandler(async (req, res, next) => {
			throw new APIError(ErrorCode.NOT_FOUND, 'Route `/` not found');
		})
	)
	.use(errorHandler);

export default app;
