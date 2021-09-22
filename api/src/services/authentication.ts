import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { Knex } from 'knex';
import ms from 'ms';
import { nanoid } from 'nanoid';
import { authenticator } from 'otplib';
import getDatabase from '../database';
import emitter, { emitAsyncSafe } from '../emitter';
import env from '../env';
import {
	InvalidCredentialsException,
	InvalidOTPException,
	InvalidPayloadException,
	UserSuspendedException,
} from '../exceptions';
import { createRateLimiter } from '../rate-limiter';
import { ActivityService } from '../services/activity';
import { AbstractServiceOptions, Action, SchemaOverview, Session } from '../types';
import { Accountability } from '@directus/shared/types';
import { SettingsService } from './settings';
import { merge } from 'lodash';
import { performance } from 'perf_hooks';
import { stall } from '../utils/stall';

type AuthenticateOptions = {
	email: string;
	password?: string;
	ip?: string | null;
	userAgent?: string | null;
	otp?: string;
	[key: string]: any;
};

const loginAttemptsLimiter = createRateLimiter({ duration: 0 });

export class AuthenticationService {
	knex: Knex;
	accountability: Accountability | null;
	activityService: ActivityService;
	schema: SchemaOverview;

	constructor(options: AbstractServiceOptions) {
		this.knex = options.knex || getDatabase();
		this.accountability = options.accountability || null;
		this.activityService = new ActivityService({ knex: this.knex, schema: options.schema });
		this.schema = options.schema;
	}

	/**
	 * Retrieve the tokens for a given user email.
	 *
	 * Password is optional to allow usage of this function within the SSO flow and extensions. Make sure
	 * to handle password existence checks elsewhere
	 */
	async authenticate(
		options: AuthenticateOptions
	): Promise<{ accessToken: any; refreshToken: any; expires: any; id?: any }> {
		const STALL_TIME = 100;
		const timeStart = performance.now();

		const settingsService = new SettingsService({
			knex: this.knex,
			schema: this.schema,
		});

		const { email, password, ip, userAgent, otp } = options;

		const user = await this.knex
			.select('id', 'password', 'role', 'tfa_secret', 'status')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['email', email.toLowerCase()])
			.first();

		const updatedOptions = await emitter.emitAsync('auth.login.before', options, {
			event: 'auth.login.before',
			action: 'login',
			schema: this.schema,
			payload: options,
			accountability: this.accountability,
			status: 'pending',
			user: user?.id,
			database: this.knex,
		});

		if (updatedOptions) {
			options = updatedOptions.length > 0 ? updatedOptions.reduce((acc, val) => merge(acc, val), {}) : options;
		}

		const emitStatus = (status: 'fail' | 'success') => {
			emitAsyncSafe('auth.login', options, {
				event: 'auth.login',
				action: 'login',
				schema: this.schema,
				payload: options,
				accountability: this.accountability,
				status,
				user: user?.id,
				database: this.knex,
			});
		};

		if (!user || user.status !== 'active') {
			emitStatus('fail');

			if (user?.status === 'suspended') {
				await stall(STALL_TIME, timeStart);
				throw new UserSuspendedException();
			} else {
				await stall(STALL_TIME, timeStart);
				throw new InvalidCredentialsException();
			}
		}

		const { auth_login_attempts: allowedAttempts } = await settingsService.readSingleton({
			fields: ['auth_login_attempts'],
		});

		if (allowedAttempts !== null) {
			// @ts-ignore - See https://github.com/animir/node-rate-limiter-flexible/issues/109
			loginAttemptsLimiter.points = allowedAttempts;

			try {
				await loginAttemptsLimiter.consume(user.id);
			} catch {
				await this.knex('directus_users').update({ status: 'suspended' }).where({ id: user.id });
				user.status = 'suspended';

				// This means that new attempts after the user has been re-activated will be accepted
				await loginAttemptsLimiter.set(user.id, 0, 0);
			}
		}

		if (password !== undefined) {
			if (!user.password) {
				emitStatus('fail');
				await stall(STALL_TIME, timeStart);
				throw new InvalidCredentialsException();
			}

			if ((await argon2.verify(user.password, password)) === false) {
				emitStatus('fail');
				await stall(STALL_TIME, timeStart);
				throw new InvalidCredentialsException();
			}
		}

		if (user.tfa_secret && !otp) {
			emitStatus('fail');
			await stall(STALL_TIME, timeStart);
			throw new InvalidOTPException(`"otp" is required`);
		}

		if (user.tfa_secret && otp) {
			const otpValid = await this.verifyOTP(user.id, otp);

			if (otpValid === false) {
				emitStatus('fail');
				await stall(STALL_TIME, timeStart);
				throw new InvalidOTPException(`"otp" is invalid`);
			}
		}

		let payload = {
			id: user.id,
		};

		const customClaims = await emitter.emitAsync('auth.jwt.before', payload, {
			event: 'auth.jwt.before',
			action: 'jwt',
			schema: this.schema,
			payload: payload,
			accountability: this.accountability,
			status: 'pending',
			user: user?.id,
			database: this.knex,
		});

		if (customClaims) {
			payload = customClaims.length > 0 ? customClaims.reduce((acc, val) => merge(acc, val), payload) : payload;
		}

		/**
		 * @TODO
		 * Sign token with combination of server secret + user password hash
		 * That way, old tokens are immediately invalidated whenever the user changes their password
		 */
		const accessToken = jwt.sign(payload, env.SECRET as string, {
			expiresIn: env.ACCESS_TOKEN_TTL,
			issuer: 'directus',
		});

		const refreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as string));

		await this.knex('directus_sessions').insert({
			token: refreshToken,
			user: user.id,
			expires: refreshTokenExpiration,
			ip,
			user_agent: userAgent,
		});

		await this.knex('directus_sessions').delete().where('expires', '<', new Date());

		if (this.accountability) {
			await this.activityService.createOne({
				action: Action.AUTHENTICATE,
				user: user.id,
				ip: this.accountability.ip,
				user_agent: this.accountability.userAgent,
				collection: 'directus_users',
				item: user.id,
			});
		}

		await this.knex('directus_users').update({ last_access: new Date() }).where({ id: user.id });

		emitStatus('success');

		if (allowedAttempts !== null) {
			await loginAttemptsLimiter.set(user.id, 0, 0);
		}

		await stall(STALL_TIME, timeStart);

		return {
			accessToken,
			refreshToken,
			expires: ms(env.ACCESS_TOKEN_TTL as string),
			id: user.id,
		};
	}

	async refresh(refreshToken: string): Promise<Record<string, any>> {
		if (!refreshToken) {
			throw new InvalidCredentialsException();
		}

		const record = await this.knex
			.select<Session & { email: string; id: string }>(
				'directus_sessions.*',
				'directus_users.email',
				'directus_users.id'
			)
			.from('directus_sessions')
			.where({ 'directus_sessions.token': refreshToken })
			.leftJoin('directus_users', 'directus_sessions.user', 'directus_users.id')
			.first();

		if (!record || !record.email || record.expires < new Date()) {
			throw new InvalidCredentialsException();
		}

		const accessToken = jwt.sign({ id: record.id }, env.SECRET as string, {
			expiresIn: env.ACCESS_TOKEN_TTL,
			issuer: 'directus',
		});

		const newRefreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as string));

		await this.knex('directus_sessions')
			.update({ token: newRefreshToken, expires: refreshTokenExpiration })
			.where({ token: refreshToken });

		await this.knex('directus_users').update({ last_access: new Date() }).where({ id: record.id });

		return {
			accessToken,
			refreshToken: newRefreshToken,
			expires: ms(env.ACCESS_TOKEN_TTL as string),
			id: record.id,
		};
	}

	async logout(refreshToken: string): Promise<void> {
		await this.knex.delete().from('directus_sessions').where({ token: refreshToken });
	}

	generateTFASecret(): string {
		const secret = authenticator.generateSecret();
		return secret;
	}

	async generateOTPAuthURL(pk: string, secret: string): Promise<string> {
		const user = await this.knex.select('email').from('directus_users').where({ id: pk }).first();
		const project = await this.knex.select('project_name').from('directus_settings').limit(1).first();
		return authenticator.keyuri(user.email, project?.project_name || 'Directus', secret);
	}

	async verifyOTP(pk: string, otp: string, secret?: string): Promise<boolean> {
		let tfaSecret: string;
		if (!secret) {
			const user = await this.knex.select('tfa_secret').from('directus_users').where({ id: pk }).first();

			if (!user.tfa_secret) {
				throw new InvalidPayloadException(`User "${pk}" doesn't have TFA enabled.`);
			}
			tfaSecret = user.tfa_secret;
		} else {
			tfaSecret = secret;
		}

		return authenticator.check(otp, tfaSecret);
	}

	async verifyPassword(pk: string, password: string): Promise<boolean> {
		const userRecord = await this.knex.select('password').from('directus_users').where({ id: pk }).first();

		if (!userRecord || !userRecord.password) {
			throw new InvalidCredentialsException();
		}

		if ((await argon2.verify(userRecord.password, password)) === false) {
			throw new InvalidCredentialsException();
		}

		return true;
	}
}
