import { RequestHandler } from 'express';
import { expressLogger } from './logger';
import cookieParser from 'cookie-parser';
import extractToken from './middleware/extract-token';
import payloadSizeLimiter from './middleware/payload-size-limiter';
import poweredBy from './middleware/powered-by';
import env from './env';
import cors from './middleware/cors';
import rootRedirect from './middleware/root-redirect';
import rateLimiter from './middleware/rate-limiter';
import { session } from './middleware/session';
import authenticate from './middleware/authenticate';
import { checkIP } from './middleware/check-ip';
import sanitizeQuery from './middleware/sanitize-query';

export function middlewaresFactory(): { name: string; handler: RequestHandler }[] {
	const middlewares: { name: string; handler: RequestHandler }[] = [];

	middlewares.push({ name: 'expressLogger', handler: expressLogger });
	middlewares.push({ name: 'payloadSizeLimiter', handler: payloadSizeLimiter });
	middlewares.push({ name: 'cookieParser', handler: cookieParser() });
	middlewares.push({ name: 'extractToken', handler: extractToken });
	middlewares.push({ name: 'poweredBy', handler: poweredBy });

	if (env.CORS_ENABLED === true) {
		middlewares.push({ name: 'cors', handler: cors });
	}

	middlewares.push({ name: 'rootRedirect', handler: rootRedirect });

	if (env.RATE_LIMITER_ENABLED === true) {
		// use the rate limiter - all routes for now
		middlewares.push({ name: 'rateLimiter', handler: rateLimiter });
	}

	// We only rely on cookie-sessions in the oAuth flow where it's required
	middlewares.push({ name: 'session', handler: session });
	middlewares.push({ name: 'authenticate', handler: authenticate });
	middlewares.push({ name: 'checkIP', handler: checkIP });
	middlewares.push({ name: 'sanitizeQuery', handler: sanitizeQuery });

	return middlewares;
}
