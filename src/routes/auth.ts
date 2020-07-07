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

const router = Router();

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
	mode: Joi.string().valid('cookie', 'json'),
});

router.post(
	'/authenticate',
	asyncHandler(async (req, res) => {
		const { error } = loginSchema.validate(req.body);
		if (error) throw new InvalidPayloadException(error.message);

		const { email, password } = req.body;

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

		return res.status(200).json({
			data: { access_token: accessToken, refresh_token: refreshToken, expires },
		});
	})
);

router.use(
	'/sso',
	session({ secret: process.env.SECRET, saveUninitialized: false, resave: false })
);

router.use(grant.express()(getGrantConfig()));

router.get(
	'/sso/:provider/callback',
	asyncHandler(async (req, res) => {
		const email = getEmailFromProfile(req.params.provider, req.session.grant.response.profile);

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
