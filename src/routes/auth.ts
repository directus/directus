import { Router } from 'express';
import session from 'express-session';
import asyncHandler from 'express-async-handler';
import Joi from '@hapi/joi';
import * as AuthService from '../services/auth';
import grant from 'grant';
import getGrantConfig from '../utils/get-grant-config';
import getEmailFromProfile from '../utils/get-email-from-profile';

const router = Router();

const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});

router.post(
	'/authenticate',
	asyncHandler(async (req, res) => {
		await loginSchema.validateAsync(req.body);
		const { email, password } = req.body;

		/**
		 * @TODO
		 * Make sure to validate the payload. AuthService.authenticate's password is optional which
		 * means there's a possible problem when req.body.password is undefined
		 */

		const token = await AuthService.authenticate(email, password);

		return res.status(200).json({
			data: { token },
		});
	})
);

router.use('/sso', session({ secret: process.env.SECRET, saveUninitialized: true, resave: false }));

router.use(grant.express()(getGrantConfig()));

router.get(
	'/sso/:provider/callback',
	asyncHandler(async (req, res) => {
		const email = getEmailFromProfile(req.params.provider, req.session.grant.response.profile);

		const token = await AuthService.authenticate(email);

		return res.status(200).json({
			data: { token },
		});
	})
);

export default router;
