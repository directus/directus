import { useEnv } from '@directus/env';
import cors from 'cors';
import type { RequestHandler } from 'express';

let corsMiddleware: RequestHandler = (_req, _res, next) => next();

const env = useEnv();

if (env['CORS_ENABLED'] === true) {
	corsMiddleware = cors({
		origin: env['CORS_ORIGIN'] as string || true,
		methods: env['CORS_METHODS'] as string || 'GET,POST,PATCH,DELETE',
		allowedHeaders: env['CORS_ALLOWED_HEADERS'] as string,
		exposedHeaders: env['CORS_EXPOSED_HEADERS'] as string,
		credentials: env['CORS_CREDENTIALS'] as boolean || undefined,
		maxAge: env['CORS_MAX_AGE'] as number || undefined,
	});
}

export default corsMiddleware;
