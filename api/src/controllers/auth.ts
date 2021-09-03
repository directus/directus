import { Router } from 'express';
import grant from 'grant';
import Joi from 'joi';
import ms from 'ms';
import emitter, { emitAsyncSafe } from '../emitter';
import env from '../env';
import getDatabase from '../database';
import { DEFAULT_AUTH_PROVIDER } from '../constants';
import {
	InvalidCredentialsException,
	RouteNotFoundException,
	ServiceUnavailableException,
	InvalidPayloadException,
} from '../exceptions';
import grantConfig from '../grant';
import { respond } from '../middleware/respond';
import { AuthenticationService, UsersService } from '../services';
import asyncHandler from '../utils/async-handler';
import getEmailFromProfile from '../utils/get-email-from-profile';
import { toArray } from '@directus/shared/utils';
import logger from '../logger';

const router = Router();

const loginSchema = Joi.object({
	email: Joi.string().required(),
	password: Joi.string().required(),
	mode: Joi.string().valid('cookie', 'json'),
	otp: Joi.string(),
	provider: Joi.string(),
}).unknown();

const loginHandler = async (req: any, res: any, next: any) => {
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
		identifier: req.body.email,
		provider: req.params.provider,
	});

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
};

router.post('/login', asyncHandler(loginHandler), respond);

router.post('/:provider/login', asyncHandler(loginHandler), respond);

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
		const providers = toArray(env.AUTH_PROVIDERS);
		const providerData = providers
			.filter((provider) => provider && env[`AUTH_${provider.toUpperCase()}_DRIVER`])
			.map((provider) => ({
				name: provider,
				driver: env[`AUTH_${provider.toUpperCase()}_DRIVER`],
			}));
		res.locals.payload = { data: env.AUTH_PROVIDERS ? providerData : null };
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

		const hookPayload = {
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

		const hookPayload = req.session.grant.response;

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

			const database = getDatabase();
			const user = await database.select('provider').from('directus_users').where('email', email).first();

			if (!user) {
				throw new InvalidCredentialsException('Email does not match existing user');
			}

			/**
			 * The default auth provider should allow auth by email. If that ever
			 * changes, this will need to be addressed
			 */
			authResponse = await authenticationService.authenticate({
				identifier: email,
				provider: DEFAULT_AUTH_PROVIDER,
			});
		} catch (error: any) {
			emitStatus('fail');

			logger.warn(error);

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
			res.cookie(env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
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
