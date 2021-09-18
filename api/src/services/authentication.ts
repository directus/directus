import jwt from 'jsonwebtoken';
import { Knex } from 'knex';
import ms from 'ms';
import { nanoid } from 'nanoid';
import getDatabase from '../database';
import emitter, { emitAsyncSafe } from '../emitter';
import env from '../env';
import auth from '../auth';
import { DEFAULT_AUTH_PROVIDER } from '../constants';
import { InvalidCredentialsException, InvalidOTPException, UserSuspendedException } from '../exceptions';
import { createRateLimiter } from '../rate-limiter';
import { ActivityService } from './activity';
import { TFAService } from './tfa';
import { AbstractServiceOptions, Action, SchemaOverview, Session, User } from '../types';
import { Accountability } from '@directus/shared/types';
import { SettingsService } from './settings';
import { merge } from 'lodash';
import { performance } from 'perf_hooks';
import { stall } from '../utils/stall';

type AuthenticateOptions = {
	identifier: string;
	password?: string;
	provider?: string;
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
		options: AuthenticateOptions,
		...args: any[]
	): Promise<{ accessToken: any; refreshToken: any; expires: any; id?: any }> {
		const { identifier, password, ip, userAgent, otp } = options;

		const STALL_TIME = 100;
		const timeStart = performance.now();

		const providerName = options.provider ?? DEFAULT_AUTH_PROVIDER;
		const provider = auth.getProvider(providerName);

		const user = await this.knex
			.select<User & { tfa_secret: string | null }>(
				'id',
				'first_name',
				'last_name',
				'email',
				'password',
				'status',
				'role',
				'tfa_secret',
				'provider',
				'alternate_identifier',
				'auth_data'
			)
			.from('directus_users')
			.where('id', await provider.userID(identifier))
			.andWhere('provider', providerName)
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

		if (user?.status !== 'active') {
			emitStatus('fail');

			if (user?.status === 'suspended') {
				await stall(STALL_TIME, timeStart);
				throw new UserSuspendedException();
			} else {
				await stall(STALL_TIME, timeStart);
				throw new InvalidCredentialsException();
			}
		}

		const settingsService = new SettingsService({
			knex: this.knex,
			schema: this.schema,
		});

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
			try {
				await provider.verify({ ...user }, password, ...args);
			} catch (e) {
				emitStatus('fail');
				await stall(STALL_TIME, timeStart);
				throw e;
			}
		}

		if (user.tfa_secret && !otp) {
			emitStatus('fail');
			await stall(STALL_TIME, timeStart);
			throw new InvalidOTPException(`"otp" is required`);
		}

		if (user.tfa_secret && otp) {
			const tfaService = new TFAService({ knex: this.knex, schema: this.schema });
			const otpValid = await tfaService.verifyOTP(user.id, otp);

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
		const accessToken = jwt.sign({ id: user.id }, env.SECRET as string, {
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
			.select<Session & User>(
				's.expires',
				'u.id',
				'u.first_name',
				'u.last_name',
				'u.email',
				'u.password',
				'u.status',
				'u.role',
				'u.provider',
				'u.alternate_identifier',
				'u.auth_data'
			)
			.from('directus_sessions as s')
			.innerJoin('directus_users as u', 's.user', 'u.id')
			.where('s.token', refreshToken)
			.first();

		if (!record || record.expires < new Date()) {
			throw new InvalidCredentialsException();
		}

		const provider = auth.getProvider(record.provider);
		await provider.refresh({ ...record });

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
		const user = await this.knex
			.select<User>(
				'u.id',
				'u.first_name',
				'u.last_name',
				'u.email',
				'u.password',
				'u.status',
				'u.role',
				'u.provider',
				'u.alternate_identifier',
				'u.auth_data'
			)
			.from('directus_sessions as s')
			.innerJoin('directus_users as u', 's.user', 'u.id')
			.where('s.token', refreshToken)
			.first();

		if (user) {
			const provider = auth.getProvider(user.provider);
			await provider.logout({ ...user });

			await this.knex.delete().from('directus_sessions').where('token', refreshToken);
		}
	}

	async verifyPassword(userID: string, password: string): Promise<void> {
		const user = await this.knex
			.select<User>(
				'id',
				'first_name',
				'last_name',
				'email',
				'password',
				'status',
				'role',
				'provider',
				'alternate_identifier',
				'auth_data'
			)
			.from('directus_users')
			.where('id', userID)
			.first();

		if (!user) {
			throw new InvalidCredentialsException();
		}

		const provider = auth.getProvider(user.provider);
		await provider.verify({ ...user }, password);
	}
}
