import type { Accountability } from '@directus/types';
import argon2 from 'argon2';
import { Router } from 'express';
import Joi from 'joi';
import { performance } from 'perf_hooks';
import { COOKIE_OPTIONS } from '../../constants.js';
import env from '../../env.js';
import { InvalidCredentialsError, InvalidPayloadError } from '@directus/errors';
import { respond } from '../../middleware/respond.js';
import { AuthenticationService } from '../../services/authentication.js';
import type { User } from '../../types/index.js';
import asyncHandler from '../../utils/async-handler.js';
import { getIPFromReq } from '../../utils/get-ip-from-req.js';
import { stall } from '../../utils/stall.js';
import { AuthDriver } from '../auth.js';

export class LocalAuthDriver extends AuthDriver {
	async getUserID(payload: Record<string, any>): Promise<string> {
		if (!payload['email']) {
			throw new InvalidCredentialsError();
		}

		const user = await this.knex
			.select('id')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['email', payload['email'].toLowerCase()])
			.first();

		if (!user) {
			throw new InvalidCredentialsError();
		}

		return user.id;
	}

	async verify(user: User, password?: string): Promise<void> {
		if (!user.password || !(await argon2.verify(user.password, password as string))) {
			throw new InvalidCredentialsError();
		}
	}

	override async login(user: User, payload: Record<string, any>): Promise<void> {
		await this.verify(user, payload['password']);
	}
}

export function createLocalAuthRouter(provider: string): Router {
	const router = Router();

	const userLoginSchema = Joi.object({
		email: Joi.string().email().required(),
		password: Joi.string().required(),
		mode: Joi.string().valid('cookie', 'json'),
		otp: Joi.string(),
	}).unknown();

	router.post(
		'/',
		asyncHandler(async (req, res, next) => {
			const STALL_TIME = env['LOGIN_STALL_TIME'];
			const timeStart = performance.now();

			const accountability: Accountability = {
				ip: getIPFromReq(req),
				role: null,
			};

			const userAgent = req.get('user-agent');
			if (userAgent) accountability.userAgent = userAgent;

			const origin = req.get('origin');
			if (origin) accountability.origin = origin;

			const authenticationService = new AuthenticationService({
				accountability: accountability,
				schema: req.schema,
			});

			const { error } = userLoginSchema.validate(req.body);

			if (error) {
				await stall(STALL_TIME, timeStart);
				throw new InvalidPayloadError({ reason: error.message });
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
				payload['data']!['refresh_token'] = refreshToken;
			}

			if (mode === 'cookie') {
				res.cookie(env['REFRESH_TOKEN_COOKIE_NAME'], refreshToken, COOKIE_OPTIONS);
			}

			res.locals['payload'] = payload;

			return next();
		}),
		respond
	);

	return router;
}
