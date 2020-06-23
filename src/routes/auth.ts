import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import Joi from '@hapi/joi';
import * as AuthService from '../services/auth';

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

export default router;
