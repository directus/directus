import cors from 'cors';
import { RequestHandler } from 'express';
import env from '../env';
import { toArray } from '@directus/shared/utils';

let corsMiddleware: RequestHandler = (req, res, next) => next();

if (env.CORS_ENABLED === true) {
	const originWhitelist = env.CORS_ORIGIN ? toArray(env.CORS_ORIGIN) : false;

	corsMiddleware = cors({
		origin: function (origin, callback) {
			if (!originWhitelist) {
				callback(null, true);
			} else if (originWhitelist.indexOf(origin) !== -1) {
				callback(null, origin);
			} else {
				callback(null, originWhitelist[0]);
			}
		},
		methods: env.CORS_METHODS || 'GET,POST,PATCH,DELETE',
		allowedHeaders: env.CORS_ALLOWED_HEADERS,
		exposedHeaders: env.CORS_EXPOSED_HEADERS,
		credentials: env.CORS_CREDENTIALS || undefined,
		maxAge: env.CORS_MAX_AGE || undefined,
	});
}

export default corsMiddleware;
