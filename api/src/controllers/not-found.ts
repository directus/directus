import { RequestHandler } from 'express';
import emitter from '../emitter';
import { RouteNotFoundException } from '../exceptions';

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
		const hooksResult = await emitter.emitFilter('request.not_found', req, res);
		if (hooksResult.reduce((prev, current) => current || prev, false)) {
			return next();
		}
		next(new RouteNotFoundException(req.path));
	} catch (err: any) {
		next(err);
	}
};

export default notFound;
