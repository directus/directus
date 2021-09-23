import argon2 from 'argon2';
import { AuthDriver } from '../auth';
import { User } from '../../types';
import { InvalidCredentialsException, InvalidPayloadException } from '../../exceptions';
import { AuthenticationService } from '../../services';
import { Router } from 'express';
import Joi from 'joi';
import asyncHandler from '../../utils/async-handler';
import env from '../../env';
import ms from 'ms';
import { Knex } from 'knex';
import { respond } from '../../middleware/respond';

export class LocalAuthDriver extends AuthDriver {
	// Config could be used in the future for selecting what field to use as the identifier
	constructor(knex: Knex, _config: Record<string, any>) {
		super(knex);
	}

	/**
	 * Get user id by email
	 */
	async userID(email: string): Promise<string> {
		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['email', email.toLowerCase()])
			.first();

		if (!user) {
			throw new InvalidCredentialsException();
		}

		return user.id;
	}

	/**
	 * Verify user password
	 */
	async verify(user: User, password?: string): Promise<void> {
		if (!user.password || !(await argon2.verify(user.password, password as string))) {
			throw new InvalidCredentialsException();
		}
	}
}

export function createLocalAuthRouter(): Router {
	const router = Router();

	const loginSchema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().required(),
		mode: Joi.string().valid('cookie', 'json'),
		otp: Joi.string(),
	}).unknown();

	router.post(
		'/',
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
		}),
		respond
	);

	return router;
}
