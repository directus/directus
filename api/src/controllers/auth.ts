import { Router } from 'express';
import session from 'express-session';
import asyncHandler from '../utils/async-handler';
import Joi from 'joi';
import grant from 'grant';
import getEmailFromProfile from '../utils/get-email-from-profile';
import { InvalidPayloadException } from '../exceptions/invalid-payload';
import ms from 'ms';
import env from '../env';
import { UsersService, AuthenticationService } from '../services';
import grantConfig from '../grant';
import { InvalidCredentialsException, RouteNotFoundException, ServiceUnavailableException } from '../exceptions';
import { respond } from '../middleware/respond';
import { toArray } from '../utils/to-array';
import emitter, { emitAsyncSafe } from '../emitter';

const router = Router();

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
	mode: Joi.string().valid('cookie', 'json'),
	otp: Joi.string(),
}).unknown();

router.post(
	'/login',
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

		const { error } = loginSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);

		const mode = req.body.mode || 'json';

		const ip = req.ip;
		const userAgent = req.get('user-agent');

		const { accessToken, refreshToken, expires } = await authenticationService.authenticate({
			...req.body,
			ip,
			userAgent,
		});

		const payload = {
			data: { access_token: accessToken, expires },
		} as Record<string, Record<string, any>>;

		if (mode === 'json') {
			payload.data.refresh_token = refreshToken;
		}

		if (mode === 'cookie') {
			res.cookie('directus_refresh_token', refreshToken, {
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

		const currentRefreshToken = req.body.refresh_token || req.cookies.directus_refresh_token;

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
			res.cookie('directus_refresh_token', refreshToken, {
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

		const currentRefreshToken = req.body.refresh_token || req.cookies.directus_refresh_token;

		if (!currentRefreshToken) {
			throw new InvalidPayloadException(`"refresh_token" is required in either the JSON payload or Cookie`);
		}

		await authenticationService.logout(currentRefreshToken);

		if (req.cookies.directus_refresh_token) {
			res.clearCookie('directus_refresh_token', {
				domain: env.REFRESH_TOKEN_COOKIE_DOMAIN,
			});
		}

		return next();
	}),
	respond
);

router.post(
	'/password/request',
	asyncHandler(async (req, res, next) => {
		if (!req.body.email) {
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
		} catch (err) {
			if (err instanceof InvalidPayloadException) {
				throw err;
			} else {
				return next();
			}
		}
	}),
	respond
);

router.post(
	'/password/reset',
	asyncHandler(async (req, res, next) => {
		if (!req.body.token) {
			throw new InvalidPayloadException(`"token" field is required.`);
		}

		if (!req.body.password) {
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
	'/oauth',
	asyncHandler(async (req, res, next) => {
		const providers = toArray(env.OAUTH_PROVIDERS);
		res.locals.payload = { data: env.OAUTH_PROVIDERS ? providers : null };
		return next();
	}),
	respond
);

router.use('/oauth', session({ secret: env.SECRET as string, saveUninitialized: false, resave: false }));

router.get(
	'/oauth/:provider',
	asyncHandler(async (req, res, next) => {
		const config = { ...grantConfig };
		delete config.defaults;

		const availableProviders = Object.keys(config);

		if (availableProviders.includes(req.params.provider) === false) {
			throw new RouteNotFoundException(`/auth/oauth/${req.params.provider}`);
		}

		if (req.query?.redirect && req.session) {
			req.session.redirect = req.query.redirect as string;
		}

		let hookPayload = {
			provider: req.params.provider,
			redirect: req.query?.redirect,
		};

		emitAsyncSafe(`oauth.${req.params.provider}.redirect`, {
			event: `oauth.${req.params.provider}.redirect`,
			action: 'redirect',
			schema: req.schema,
			payload: hookPayload,
			accountability: req.accountability,
			user: null,
		});

		await emitter.emitAsync(`oauth.${req.params.provider}.redirect.before`, {
			event: `oauth.${req.params.provider}.redirect.before`,
			action: 'redirect',
			schema: req.schema,
			payload: hookPayload,
			accountability: req.accountability,
			user: null,
		});

		next();
	})
);

router.use(grant.express()(grantConfig));

router.get(
	'/oauth/:provider/callback',
	asyncHandler(async (req, res, next) => {
		const redirect = req.session.redirect;

		const accountability = {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			role: null,
		};

		const authenticationService = new AuthenticationService({
			accountability: accountability,
			schema: req.schema,
		});

		let authResponse: { accessToken: any; refreshToken: any; expires: any; id?: any };

		let hookPayload = req.session.grant.response;

		await emitter.emitAsync(`oauth.${req.params.provider}.login.before`, hookPayload, {
			event: `oauth.${req.params.provider}.login.before`,
			action: 'oauth.login',
			schema: req.schema,
			payload: hookPayload,
			accountability: accountability,
			status: 'pending',
			user: null,
		});

		const emitStatus = (status: 'fail' | 'success') => {
			emitAsyncSafe(`oauth.${req.params.provider}.login`, hookPayload, {
				event: `oauth.${req.params.provider}.login`,
				action: 'oauth.login',
				schema: req.schema,
				payload: hookPayload,
				accountability: accountability,
				status,
				user: null,
			});
		};

		try {
			const email = getEmailFromProfile(req.params.provider, req.session.grant.response?.profile);

			req.session?.destroy(() => {
				// Do nothing
			});

			authResponse = await authenticationService.authenticate({
				email,
			});
		} catch (error) {
			emitStatus('fail');
			if (redirect) {
				let reason = 'UNKNOWN_EXCEPTION';

				if (error instanceof ServiceUnavailableException) {
					reason = 'SERVICE_UNAVAILABLE';
				} else if (error instanceof InvalidCredentialsException) {
					reason = 'INVALID_USER';
				}

				return res.redirect(`${redirect.split('?')[0]}?reason=${reason}`);
			}

			throw error;
		}

		const { accessToken, refreshToken, expires } = authResponse;

		emitStatus('success');

		if (redirect) {
			res.cookie('directus_refresh_token', refreshToken, {
				httpOnly: true,
				domain: env.REFRESH_TOKEN_COOKIE_DOMAIN,
				maxAge: ms(env.REFRESH_TOKEN_TTL as string),
				secure: env.REFRESH_TOKEN_COOKIE_SECURE ?? false,
				sameSite: (env.REFRESH_TOKEN_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'strict',
			});

			return res.redirect(redirect);
		} else {
			res.locals.payload = {
				data: { access_token: accessToken, refresh_token: refreshToken, expires },
			};

			return next();
		}
	}),
	respond
);

export default router;
