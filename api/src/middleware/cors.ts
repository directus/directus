import { useEnv } from '@directus/env';
import corsMiddleware from 'cors';

const env = useEnv();

export const cors = corsMiddleware({
	origin: (env['CORS_ORIGIN'] as string) || true,
	methods: (env['CORS_METHODS'] as string) || 'GET,POST,PATCH,DELETE',
	allowedHeaders: env['CORS_ALLOWED_HEADERS'] as string,
	exposedHeaders: env['CORS_EXPOSED_HEADERS'] as string,
	credentials: (env['CORS_CREDENTIALS'] as boolean) || undefined,
	maxAge: (env['CORS_MAX_AGE'] as number) || undefined,
});
