import cors from 'cors';
import { RequestHandler } from 'express';
import env from '../env';

let corsMiddleware: RequestHandler = (req, res, next) => next();

if (env.CORS_ENABLED === true) {
	corsMiddleware = cors({
		origin: function (origin, callback) {
			if (!origin || (typeof env.CORS_ORIGIN == 'string' && env.CORS_ORIGIN == origin) || (Array.isArray(env.CORS_ORIGIN) && env.CORS_ORIGIN.indexOf(origin) !== -1)) {
				callback(null, true);
			} else {
				callback(new Error("Not allowed by CORS"));
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
