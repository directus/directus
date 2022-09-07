import cors from 'cors';
import type { RequestHandler } from 'express';
import env from '../env.js';

let corsMiddleware: RequestHandler = (_req, _res, next) => next();

if (env['CORS_ENABLED'] === true) {
	corsMiddleware = cors({
		origin: env['CORS_ORIGIN'] || true,
		methods: env['CORS_METHODS'] || 'GET,POST,PATCH,DELETE',
		allowedHeaders: env['CORS_ALLOWED_HEADERS'],
		exposedHeaders: env['CORS_EXPOSED_HEADERS'],
		credentials: env['CORS_CREDENTIALS'] || undefined,
		maxAge: env['CORS_MAX_AGE'] || undefined,
	});
}

export default corsMiddleware;
