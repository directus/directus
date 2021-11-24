import { Router } from 'express';
import argon2 from 'argon2';
import ms from 'ms';
import Joi from 'joi';
import { AuthDriver } from '../auth';
import { User, SessionData } from '../../types';
import { InvalidCredentialsException, InvalidPayloadException } from '../../exceptions';
import { AuthenticationService } from '../../services';
import asyncHandler from '../../utils/async-handler';
import env from '../../env';
import { respond } from '../../middleware/respond';

export class LocalAuthDriver extends AuthDriver {
	async getUserID(payload: Record<string, any>): Promise<string> {
		if (!payload.email) {
			throw new InvalidCredentialsException();
		}

		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['email', payload.email.toLowerCase()])
			.first();

		if (!user) {
			throw new InvalidCredentialsException();
		}

		return user.id;
	}

	async verify(user: User, password?: string): Promise<void> {
		if (!user.password || !(await argon2.verify(user.password, password as string))) {
			throw new InvalidCredentialsException();
		}
	}

	async login(user: User, payload: Record<string, any>): Promise<SessionData> {
		await this.verify(user, payload.password);
		return null;
	}
}

export function createLocalAuthRouter(provider: string): Router {
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

			if (error) {
				throw new InvalidPayloadException(error.message);
			}

			const mode = req.body.mode || 'json';

			const { accessToken, refreshToken, expires } = await authenticationService.login(
				provider,
				req.body,
				req.body?.otp
			);

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
