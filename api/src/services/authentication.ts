import jwt from 'jsonwebtoken';
import { Knex } from 'knex';
import ms from 'ms';
import { nanoid } from 'nanoid';
import getDatabase from '../database';
import emitter, { emitAsyncSafe } from '../emitter';
import env from '../env';
import auth from '../auth';
import { DEFAULT_AUTH_PROVIDER } from '../constants';
import { InvalidCredentialsException, User } from '@directus/auth';
import { InvalidOTPException, UserSuspendedException } from '../exceptions';
import { createRateLimiter } from '../rate-limiter';
import { ActivityService } from './activity';
import { TFAService } from './tfa';
import { AbstractServiceOptions, Accountability, Action, SchemaOverview, Session } from '../types';
import { SettingsService } from './settings';
import { merge } from 'lodash';

type AuthenticateOptions = {
	identifier: string;
	secret?: string;
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
		options: AuthenticateOptions
	): Promise<{ accessToken: any; refreshToken: any; expires: any; id?: any }> {
		const { identifier, secret, ip, userAgent, otp } = options;

		const providerKey = options.provider ?? DEFAULT_AUTH_PROVIDER;
		const provider = auth.getProvider(providerKey);

		let user = await this.knex
			.select<User & { tfa_secret: string | null }>('id', 'password', 'role', 'tfa_secret', 'status')
			.from('directus_users')
			.where('id', await provider.userID(identifier))
			.andWhere('provider', providerKey)
			.first();

		const updatedUser = await emitter.emitAsync('auth.login.before', options, {
			event: 'auth.login.before',
			action: 'login',
			schema: this.schema,
			payload: options,
			accountability: this.accountability,
			status: 'pending',
			user: user?.id,
			database: this.knex,
		});

		if (updatedUser) {
			user = updatedUser.length > 0 ? updatedUser.reduce((val, acc) => merge(acc, val)) : user;
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
				throw new UserSuspendedException();
			} else {
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
			} catch (err) {
				await this.knex('directus_users').update({ status: 'suspended' }).where({ id: user.id });
				user.status = 'suspended';

				// This means that new attempts after the user has been re-activated will be accepted
				await loginAttemptsLimiter.set(user.id, 0, 0);
			}
		}

		if (secret !== undefined) {
			try {
				await provider.verify(user, secret);
			} catch (e) {
				emitStatus('fail');
				throw e;
			}
		}

		if (user.tfa_secret && !otp) {
			emitStatus('fail');
			throw new InvalidOTPException(`"otp" is required`);
		}

		if (user.tfa_secret && otp) {
			const tfaService = new TFAService({ knex: this.knex, schema: this.schema });
			const otpValid = await tfaService.verifyOTP(user.id, otp);

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

		const session = await this.knex
			.select<Session & User>('s.expires', 'u.id', 'u.password', 'u.role', 'u.status', 'u.provider')
			.from('directus_sessions as s')
			.innerJoin('directus_users as u', 's.user', 'u.id')
			.where('token', refreshToken)
			.first();

		if (!session || session.expires < new Date()) {
			throw new InvalidCredentialsException();
		}

		const provider = auth.getProvider(session.provider);

		await provider.refresh(session);

		const accessToken = jwt.sign({ id: session.id }, env.SECRET as string, {
			expiresIn: env.ACCESS_TOKEN_TTL,
		});

		const newRefreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as string));

		await this.knex('directus_sessions')
			.update({ token: newRefreshToken, expires: refreshTokenExpiration })
			.where({ token: refreshToken });

		await this.knex('directus_users').update({ last_access: new Date() }).where({ id: session.id });

		return {
			accessToken,
			refreshToken: newRefreshToken,
			expires: ms(env.ACCESS_TOKEN_TTL as string),
			id: session.id,
		};
	}

	async logout(refreshToken: string): Promise<void> {
		const user = await this.knex
			.select<User>('u.id', 'u.password', 'u.role', 'u.status', 'u.provider')
			.from('directus_sessions as s')
			.innerJoin('directus_users as u', 's.user', 'u.id')
			.where('token', refreshToken)
			.first();

		if (user) {
			const provider = auth.getProvider(user.provider);

			await provider.logout(user);
			await this.knex.delete().from('directus_sessions').where('token', refreshToken);
		}
	}

	async verifyPassword(userID: string, secret: string): Promise<void> {
		const user = await this.knex
			.select<User>('id', 'password', 'role', 'status', 'provider')
			.from('directus_users')
			.where('id', userID)
			.first();

		if (!user) {
			throw new InvalidCredentialsException();
		}

		const provider = auth.getProvider(user.provider);

		await provider.verify(user, secret);
	}
}
