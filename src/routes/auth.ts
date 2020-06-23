import { Router } from 'express';
import session from 'express-session';
import asyncHandler from 'express-async-handler';
import Joi from '@hapi/joi';
import * as AuthService from '../services/auth';
import grant from 'grant';
import getGrantConfig from '../utils/get-grant-config';

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

		const token = await AuthService.authenticate(email, password);

		return res.status(200).json({
			data: { token },
		});
	})
);

router.use('/sso', session({ secret: process.env.SECRET, saveUninitialized: true, resave: false }));

router.use(grant.express()(getGrantConfig()));

router.get('/sso/:provider/callback', (req, res) => {
	console.log(req.session.grant);

	/**
	 * @TODO
	 *
	 */

	res.send(req.session.grant);
});

export default router;
