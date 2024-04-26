import { RouteNotFoundError } from '@directus/errors';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import asyncHandler from '../utils/async-handler.js';

/**
 * Handles nonexistent routes.
 *
 * - If a hook throws an error, the error gets forwarded to the error handler.
 * - If a hook returns true, the handler assumes the response has been
 *   processed and won't generate a response.
 */
const notFound = asyncHandler(async (req, res, next) => {
	const hooksResult = await emitter.emitFilter(
		'request.not_found',
		false,
		{ request: req, response: res },
		{
			database: getDatabase(),
			schema: req.schema,
			accountability: req.accountability ?? null,
		},
	);

	if (hooksResult) {
		return next();
	}

	next(new RouteNotFoundError({ path: req.path }));
});

export default notFound;
