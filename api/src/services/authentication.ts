import database from '../database';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import ms from 'ms';
import {
	InvalidCredentialsException,
	InvalidPayloadException,
	InvalidOTPException,
	UserSuspendedException,
} from '../exceptions';
import { Session, Accountability, AbstractServiceOptions, Action, SchemaOverview } from '../types';
import { Knex } from 'knex';
import { ActivityService } from '../services/activity';
import env from '../env';
import { authenticator } from 'otplib';
import emitter, { emitAsyncSafe } from '../emitter';
import { omit } from 'lodash';
import { createRateLimiter } from '../rate-limiter';
import { SettingsService } from './settings';
import { rateLimiter } from '../middleware/rate-limiter';

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
		this.knex = options.knex || database;
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
		const settingsService = new SettingsService({
			knex: this.knex,
			schema: this.schema,
		});

		const { email, password, ip, userAgent, otp } = options;

		const hookPayload = omit(options, 'password', 'otp');

		const user = await database
			.select('id', 'password', 'role', 'tfa_secret', 'status')
			.from('directus_users')
			.whereRaw('LOWER(??) = ?', ['email', email.toLowerCase()])
			.first();

		await emitter.emitAsync('auth.login.before', hookPayload, {
			event: 'auth.login.before',
			action: 'login',
			schema: this.schema,
			payload: hookPayload,
			accountability: this.accountability,
			status: 'pending',
			user: user?.id,
			database: this.knex,
		});

		const emitStatus = (status: 'fail' | 'success') => {
			emitAsyncSafe('auth.login', hookPayload, {
				event: 'auth.login',
				action: 'login',
				schema: this.schema,
				payload: hookPayload,
				accountability: this.accountability,
				status,
				user: user?.id,
				database: this.knex,
			});
		};

		if (!user || user.status !== 'active') {
			emitStatus('fail');

			if (user?.status === 'suspended') {
				throw new UserSuspendedException();
			} else {
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
			} catch (err) {
				await database('directus_users').update({ status: 'suspended' }).where({ id: user.id });
				user.status = 'suspended';

				// This means that new attempts after the user has been re-activated will be accepted
				await loginAttemptsLimiter.set(user.id, 0, 0);
			}
		}

		if (password !== undefined) {
			if (!user.password) {
				emitStatus('fail');
				throw new InvalidCredentialsException();
			}

			if ((await argon2.verify(user.password, password)) === false) {
				emitStatus('fail');
				throw new InvalidCredentialsException();
			}
		}

		if (user.tfa_secret && !otp) {
			emitStatus('fail');
			throw new InvalidOTPException(`"otp" is required`);
		}

		if (user.tfa_secret && otp) {
			const otpValid = await this.verifyOTP(user.id, otp);

			if (otpValid === false) {
				emitStatus('fail');
				throw new InvalidOTPException(`"otp" is invalid`);
			}
		}

		const payload = {
			id: user.id,
		};

		/**
		 * @TODO
		 * Sign token with combination of server secret + user password hash
		 * That way, old tokens are immediately invalidated whenever the user changes their password
		 */
		const accessToken = jwt.sign(payload, env.SECRET as string, {
			expiresIn: env.ACCESS_TOKEN_TTL,
		});

		const refreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as string));

		await database('directus_sessions').insert({
			token: refreshToken,
			user: user.id,
			expires: refreshTokenExpiration,
			ip,
			user_agent: userAgent,
		});

		await database('directus_sessions').delete().where('expires', '<', new Date());

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

		emitStatus('success');

		if (allowedAttempts !== null) {
			await loginAttemptsLimiter.set(user.id, 0, 0);
		}

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

		const record = await database
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
		});

		const newRefreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as string));

		await this.knex('directus_sessions')
			.update({ token: newRefreshToken, expires: refreshTokenExpiration })
			.where({ token: refreshToken });

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
		const user = await this.knex.select('first_name', 'last_name').from('directus_users').where({ id: pk }).first();
		const name = `${user.first_name} ${user.last_name}`;
		return authenticator.keyuri(name, 'Directus', secret);
	}

	async verifyOTP(pk: string, otp: string): Promise<boolean> {
		const user = await this.knex.select('tfa_secret').from('directus_users').where({ id: pk }).first();

		if (!user.tfa_secret) {
			throw new InvalidPayloadException(`User "${pk}" doesn't have TFA enabled.`);
		}

		const secret = user.tfa_secret;
		return authenticator.check(otp, secret);
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
