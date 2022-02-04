import { Router } from 'express';
import ms from 'ms';
import env from '../env';
import { InvalidPayloadException } from '../exceptions';
import { respond } from '../middleware/respond';
import { AuthenticationService, UsersService } from '../services';
import asyncHandler from '../utils/async-handler';
import { getAuthProviders } from '../utils/get-auth-providers';
import logger from '../logger';
import {
	createLocalAuthRouter,
	createOAuth2AuthRouter,
	createOpenIDAuthRouter,
	createLDAPAuthRouter,
} from '../auth/drivers';
import { DEFAULT_AUTH_PROVIDER } from '../constants';

const router = Router();

const authProviders = getAuthProviders();

for (const authProvider of authProviders) {
	let authRouter: Router | undefined;

	switch (authProvider.driver) {
		case 'local':
			authRouter = createLocalAuthRouter(authProvider.name);
			break;

		case 'oauth2':
			authRouter = createOAuth2AuthRouter(authProvider.name);
			break;

		case 'openid':
			authRouter = createOpenIDAuthRouter(authProvider.name);
			break;

		case 'ldap':
			authRouter = createLDAPAuthRouter(authProvider.name);
			break;
	}

	if (!authRouter) {
		logger.warn(`Couldn't create login router for auth provider "${authProvider.name}"`);
		continue;
	}

	router.use(`/login/${authProvider.name}`, authRouter);
}

router.use('/login', createLocalAuthRouter(DEFAULT_AUTH_PROVIDER));

router.post(
	'/refresh',
	asyncHandler(async (req, res, next) => {
		const accountability = {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			role: null,
		};

		const authenticationService = new AuthenticationService({
			accountability: accountability,
			schema: req.schema,
		});

		const currentRefreshToken = req.body.refresh_token || req.cookies[env.REFRESH_TOKEN_COOKIE_NAME];

		if (!currentRefreshToken) {
			throw new InvalidPayloadException(`"refresh_token" is required in either the JSON payload or Cookie`);
		}

		const mode: 'json' | 'cookie' = req.body.mode || (req.body.refresh_token ? 'json' : 'cookie');

		const { accessToken, refreshToken, expires } = await authenticationService.refresh(currentRefreshToken);

		const payload = {
			data: { access_token: accessToken, expires },
		} as Record<string, Record<string, any>>;

		if (mode === 'json') {
			payload.data.refresh_token = refreshToken;
		}

		if (mode === 'cookie') {
			res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
				httpOnly: true,
				domain: env.REFRESH_TOKEN_COOKIE_DOMAIN,
				maxAge: ms(env.REFRESH_TOKEN_TTL as string),
				secure: env.REFRESH_TOKEN_COOKIE_SECURE ?? false,
				sameSite: (env.REFRESH_TOKEN_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'strict',
			});
		}

		res.locals.payload = payload;
		return next();
	}),
	respond
);

router.post(
	'/logout',
	asyncHandler(async (req, res, next) => {
		const accountability = {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			role: null,
		};

		const authenticationService = new AuthenticationService({
			accountability: accountability,
			schema: req.schema,
		});

		const currentRefreshToken = req.body.refresh_token || req.cookies[env.REFRESH_TOKEN_COOKIE_NAME];

		if (!currentRefreshToken) {
			throw new InvalidPayloadException(`"refresh_token" is required in either the JSON payload or Cookie`);
		}

		await authenticationService.logout(currentRefreshToken);

		if (req.cookies[env.REFRESH_TOKEN_COOKIE_NAME]) {
			res.clearCookie(env.REFRESH_TOKEN_COOKIE_NAME, {
				httpOnly: true,
				domain: env.REFRESH_TOKEN_COOKIE_DOMAIN,
				secure: env.REFRESH_TOKEN_COOKIE_SECURE ?? false,
				sameSite: (env.REFRESH_TOKEN_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'strict',
			});
		}

		return next();
	}),
	respond
);

router.post(
	'/password/request',
	asyncHandler(async (req, res, next) => {
		if (typeof req.body.email !== 'string') {
			throw new InvalidPayloadException(`"email" field is required.`);
		}

		const accountability = {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			role: null,
		};

		const service = new UsersService({ accountability, schema: req.schema });

		try {
			await service.requestPasswordReset(req.body.email, req.body.reset_url || null);
			return next();
		} catch (err: any) {
			if (err instanceof InvalidPayloadException) {
				throw err;
			} else {
				logger.warn(err, `[email] ${err}`);
				return next();
			}
		}
	}),
	respond
);

router.post(
	'/password/reset',
	asyncHandler(async (req, res, next) => {
		if (typeof req.body.token !== 'string') {
			throw new InvalidPayloadException(`"token" field is required.`);
		}

		if (typeof req.body.password !== 'string') {
			throw new InvalidPayloadException(`"password" field is required.`);
		}

		const accountability = {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			role: null,
		};

		const service = new UsersService({ accountability, schema: req.schema });
		await service.resetPassword(req.body.token, req.body.password);
		return next();
	}),
	respond
);

router.get(
	'/',
	asyncHandler(async (req, res, next) => {
		res.locals.payload = { data: getAuthProviders() };
		return next();
	}),
	respond
);

export default router;
