import { Router } from 'express';
import session from 'express-session';
import asyncHandler from 'express-async-handler';
import Joi from '@hapi/joi';
import * as AuthService from '../services/auth';
import grant from 'grant';
import getGrantConfig from '../utils/get-grant-config';
import getEmailFromProfile from '../utils/get-email-from-profile';
import { InvalidPayloadException } from '../exceptions/invalid-payload';
import * as ActivityService from '../services/activity';
import ms from 'ms';
import cookieParser from 'cookie-parser';

const router = Router();

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
	mode: Joi.string().valid('cookie', 'json'),
});

router.post(
	'/login',
	asyncHandler(async (req, res) => {
		const { error } = loginSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);

		const { email, password } = req.body;

		const mode = req.body.mode || 'json';

		const ip = req.ip;
		const userAgent = req.get('user-agent');

		const { accessToken, refreshToken, expires, id } = await AuthService.authenticate({
			ip,
			userAgent,
			email,
			password,
		});

		ActivityService.createActivity({
			action: ActivityService.Action.AUTHENTICATE,
			collection: 'directus_users',
			item: id,
			ip: ip,
			user_agent: userAgent,
			action_by: id,
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
				maxAge: ms(process.env.REFRESH_TOKEN_TTL as string),
				secure: process.env.REFRESH_TOKEN_COOKIE_SECURE === 'true' ? true : false,
				sameSite:
					(process.env.REFRESH_TOKEN_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') ||
					'strict',
			});
		}

		return res.status(200).json(payload);
	})
);

router.post(
	'/refresh',
	cookieParser(),
	asyncHandler(async (req, res) => {
		const currentRefreshToken = req.body.refresh_token || req.cookies.directus_refresh_token;

		if (!currentRefreshToken) {
			throw new InvalidPayloadException(
				`"refresh_token" is required in either the JSON payload or Cookie`
			);
		}

		const mode: 'json' | 'cookie' = req.body.mode || req.body.refresh_token ? 'json' : 'cookie';

		const { accessToken, refreshToken, expires } = await AuthService.refresh(
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
				maxAge: ms(process.env.REFRESH_TOKEN_TTL as string),
				secure: process.env.REFRESH_TOKEN_COOKIE_SECURE === 'true' ? true : false,
				sameSite:
					(process.env.REFRESH_TOKEN_COOKIE_SAME_SITE as 'lax' | 'strict' | 'none') ||
					'strict',
			});
		}

		return res.status(200).json(payload);
	})
);

router.post(
	'/logout',
	cookieParser(),
	asyncHandler(async (req, res) => {
		const currentRefreshToken = req.body.refresh_token || req.cookies.directus_refresh_token;

		if (!currentRefreshToken) {
			throw new InvalidPayloadException(
				`"refresh_token" is required in either the JSON payload or Cookie`
			);
		}

		await AuthService.logout(currentRefreshToken);

		res.status(200).end();
	})
);

router.use(
	'/sso',
	session({ secret: process.env.SECRET as string, saveUninitialized: false, resave: false })
);

router.use(grant.express()(getGrantConfig()));

/**
 * @todo allow json / cookie mode in SSO
 */
router.get(
	'/sso/:provider/callback',
	asyncHandler(async (req, res) => {
		const email = getEmailFromProfile(req.params.provider, req.session!.grant.response.profile);

		const { accessToken, refreshToken, expires, id } = await AuthService.authenticate(email);

		ActivityService.createActivity({
			action: ActivityService.Action.AUTHENTICATE,
			collection: 'directus_users',
			item: id,
			ip: req.ip,
			user_agent: req.get('user-agent'),
			action_by: id,
		});

		return res.status(200).json({
			data: { access_token: accessToken, refresh_token: refreshToken, expires },
		});
	})
);

export default router;
