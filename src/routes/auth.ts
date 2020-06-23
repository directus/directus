import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import Joi from '@hapi/joi';
import database from '../database';
import APIError, { ErrorCode } from '../error';
import jwt from 'jsonwebtoken';

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

		const user = await database
			.select('id', 'password')
			.from('directus_users')
			.where({ email })
			.first();

		if (!user) {
			throw new APIError(ErrorCode.INVALID_USER_CREDENTIALS, 'Invalid user credentials');
		}

		/** @TODO implement password hash */
		if (password !== user.password) {
			throw new APIError(ErrorCode.INVALID_USER_CREDENTIALS, 'Invalid user credentials');
		}

		const payload = {
			id: user.id,
		};

		const token = jwt.sign(payload, process.env.SECRET, {
			expiresIn: process.env.ACCESS_TOKEN_EXPIRY_TIME,
		});

		return res.status(200).json({
			data: { token },
		});
	})
);

export default router;
