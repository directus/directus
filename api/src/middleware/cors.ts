import cors from 'cors';
import { RequestHandler } from 'express';
import env from '../env';

let corsMiddleware: RequestHandler = (req, res, next) => next();

if (env.CORS_ENABLED === true) {
	corsMiddleware = cors({
		origin: env.CORS_ORIGIN || true,
		methods: env.CORS_METHODS || 'GET,POST,PATCH,DELETE',
		allowedHeaders: env.CORS_ALLOWED_HEADERS || 'Content-Type,Authorization',
		exposedHeaders: env.CORS_EXPOSED_HEADERS || 'Content-Range',
		credentials: env.CORS_CREDENTIALS || true,
		maxAge: env.CORS_MAX_AGE || 18000,
	});
}

export default corsMiddleware;
