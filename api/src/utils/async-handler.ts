import { RequestHandler, ErrorRequestHandler } from 'express';

/**
 * Handles promises in routes.
 */
function asyncHandler(handler: RequestHandler): RequestHandler;
function asyncHandler(handler: ErrorRequestHandler): ErrorRequestHandler;
function asyncHandler(handler: RequestHandler | ErrorRequestHandler): RequestHandler | ErrorRequestHandler {
	if (handler.length === 2 || handler.length === 3) {
		const scoped: RequestHandler = (req, res, next) =>
			Promise.resolve((handler as RequestHandler)(req, res, next)).catch(next);
		return scoped;
	} else if (handler.length === 4) {
		const scoped: ErrorRequestHandler = (err, req, res, next) =>
			Promise.resolve((handler as ErrorRequestHandler)(err, req, res, next)).catch(next);
		return scoped;
	} else {
		throw new Error(`Failed to asyncHandle() function "${handler.name}"`);
	}
}

export default asyncHandler;
