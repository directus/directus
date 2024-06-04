import type { RequestHandler } from 'express';

const asyncHandler =
	(fn: RequestHandler): ((...args: Parameters<RequestHandler>) => Promise<ReturnType<RequestHandler>>) =>
	(req, res, next) =>
		Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
