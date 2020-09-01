import { Router } from 'express';
import session from 'express-session';
import asyncHandler from 'express-async-handler';
import Joi from 'joi';
import AuthenticationService from '../services/authentication';
import grant from 'grant';
import getGrantConfig from '../utils/get-grant-config';
import getEmailFromProfile from '../utils/get-email-from-profile';
import { InvalidPayloadException } from '../exceptions/invalid-payload';
import ms from 'ms';
import cookieParser from 'cookie-parser';
import env from '../env';
import UsersService from '../services/users';

const router = Router();

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
	mode: Joi.string().valid('cookie', 'json'),
	otp: Joi.string()
});

router.post(
	'/login',
	asyncHandler(async (req, res) => {
		const accountability = {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			role: null,
		};

		const authenticationService = new AuthenticationService({
			accountability: accountability,
		});

		const { error } = loginSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);

		const { email, password, otp } = req.body;

		const mode = req.body.mode || 'json';

		const ip = req.ip;
		const userAgent = req.get('user-agent');

		const { accessToken, refreshToken, expires, id } = await authenticationService.authenticate(
			{
				ip,
				userAgent,
				email,
				password,
				otp,
			}
		);

		const payload = {
			data: { access_token: accessToken, expires },
		} as Record<string, Record<string, any>>;

		if (mode === 'json') {
			payload.data.refresh_token = refreshToken;
		}

		if (mode === 'cookie') {
			res.cookie('directus_refresh_token', refreshToken, {
				httpOnly: true,
				maxAge: ms(env.REFRESH_TOKEN_TTL as string),
				secure: env.REFRESH_TOKEN_COOKIE_SECURE === 'true' ? true : false,
				sameSite:
					(env.REFRESH_TOKEN_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'strict',
			});
		}

		return res.status(200).json(payload);
	})
);

router.post(
	'/refresh',
	cookieParser(),
	asyncHandler(async (req, res) => {
		const accountability = {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			role: null,
		};

		const authenticationService = new AuthenticationService({
			accountability: accountability,
		});

		const currentRefreshToken = req.body.refresh_token || req.cookies.directus_refresh_token;

		if (!currentRefreshToken) {
			throw new InvalidPayloadException(
				`"refresh_token" is required in either the JSON payload or Cookie`
			);
		}

		const mode: 'json' | 'cookie' = req.body.mode || req.body.refresh_token ? 'json' : 'cookie';

		const { accessToken, refreshToken, expires } = await authenticationService.refresh(
			currentRefreshToken
		);

		const payload = {
			data: { access_token: accessToken, expires },
		} as Record<string, Record<string, any>>;

		if (mode === 'json') {
			payload.data.refresh_token = refreshToken;
		}

		if (mode === 'cookie') {
			res.cookie('directus_refresh_token', refreshToken, {
				httpOnly: true,
				maxAge: ms(env.REFRESH_TOKEN_TTL as string),
				secure: env.REFRESH_TOKEN_COOKIE_SECURE === 'true' ? true : false,
				sameSite:
					(env.REFRESH_TOKEN_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') || 'strict',
			});
		}

		return res.status(200).json(payload);
	})
);

router.post(
	'/logout',
	cookieParser(),
	asyncHandler(async (req, res) => {
		const accountability = {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			role: null,
		};

		const authenticationService = new AuthenticationService({
			accountability: accountability,
		});

		const currentRefreshToken = req.body.refresh_token || req.cookies.directus_refresh_token;

		if (!currentRefreshToken) {
			throw new InvalidPayloadException(
				`"refresh_token" is required in either the JSON payload or Cookie`
			);
		}

		await authenticationService.logout(currentRefreshToken);

		res.status(200).end();
	})
);

router.post(
	'/password/request',
	asyncHandler(async (req, res) => {
		if (!req.body.email) {
			throw new InvalidPayloadException(`"email" field is required.`);
		}

		const accountability = {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			role: null,
		};

		const service = new UsersService({ accountability });

		try {
			await service.requestPasswordReset(req.body.email);
		} catch {
			// We don't want to give away what email addresses exist, so we'll always return a 200
			// from this endpoint
		} finally {
			return res.status(200).end();
		}
	})
)

router.post(
	'/password/reset',
	asyncHandler(async (req, res) => {
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

		const service = new UsersService({ accountability });
		await service.resetPassword(req.body.token, req.body.password);
		return res.status(200).end();
	})
)

router.use(
	'/sso',
	session({ secret: env.SECRET as string, saveUninitialized: false, resave: false })
);

router.use(grant.express()(getGrantConfig()));

/**
 * @todo allow json / cookie mode in SSO
 */
router.get(
	'/sso/:provider/callback',
	asyncHandler(async (req, res) => {
		const accountability = {
			ip: req.ip,
			userAgent: req.get('user-agent'),
			role: null,
		};

		const authenticationService = new AuthenticationService({
			accountability: accountability,
		});

		const email = getEmailFromProfile(req.params.provider, req.session!.grant.response.profile);

		const { accessToken, refreshToken, expires, id } = await authenticationService.authenticate(
			email
		);

		return res.status(200).json({
			data: { access_token: accessToken, refresh_token: refreshToken, expires },
		});
	})
);

export default router;
