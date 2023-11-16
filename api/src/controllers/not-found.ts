import type { RequestHandler } from 'express';
import getDatabase from '../database/index.js';
import emitter from '../emitter.js';
import { RouteNotFoundError } from '@directus/errors';

/**
 * Handles not found routes.
 *
 * - If a hook throws an error, the error gets forwarded to the error handler.
 * - If a hook returns true, the handler assumes the response has been
 *   processed and won't generate a response.
 *
 * @param req
 * @param res
 * @param next
 */
const notFound: RequestHandler = async (req, res, next) => {
	try {
		const hooksResult = await emitter.emitFilter(
			'request.not_found',
			false,
			{ request: req, response: res },
			{
				database: getDatabase(),
				schema: req.schema,
				accountability: req.accountability ?? null,
			}
		);

		if (hooksResult) {
			return next();
		}

		next(new RouteNotFoundError({ path: req.path }));
	} catch (err: any) {
		next(err);
	}
};

export default notFound;
