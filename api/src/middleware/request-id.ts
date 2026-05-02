import type { RequestHandler } from 'express';
import { REQUEST_ID_HEADER, resolveRequestId } from '../utils/request-id.js';

export const requestIdMiddleware: RequestHandler = (req, res, next) => {
	if (res.headersSent) return next();

	const requestId = resolveRequestId(req.headers);

	// Attach to req for downstream usage (logger, error handler, extensions)
	// Express Request already has an optional `id` used by pino-http; we set it here.
	(req as any).id = requestId;

	// Always expose for clients to correlate support tickets
	res.setHeader(REQUEST_ID_HEADER, requestId);

	next();
};
