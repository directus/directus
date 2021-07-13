import jwt from 'jsonwebtoken';
import { Knex } from 'knex';
import ms from 'ms';
import { nanoid } from 'nanoid';
import { authenticator } from 'otplib';
import getDatabase from '../database';
import env from '../env';
import {
	InvalidCredentialsException,
	InvalidOTPException,
	InvalidPayloadException,
	UserSuspendedException,
} from '../exceptions';
import { createRateLimiter } from '../rate-limiter';
import { ActivityService } from '../services/activity';
import { AbstractServiceOptions, Accountability, Action, SchemaOverview, Session } from '../types';
import { SettingsService } from './settings';

/* TODO: Move out types */
export interface AuthenticateOptions {
	ip?: string | null;
	userAgent?: string | null;
	otp?: string;
	[key: string]: any;
}

export interface AuthenticatedResponse {
	accessToken: any;
	refreshToken: any;
	expires: any;
	id?: any;
}

interface User {
	id: string;
	status: 'active' | 'suspended';
	tfa_secret?: string;
}

const loginAttemptsLimiter = createRateLimiter({ duration: 0 });

export abstract class AuthenticationService {
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

	abstract authenticate(options: AuthenticateOptions): Promise<AuthenticatedResponse>;

	abstract verifyPassword(userId: string, password: string): Promise<boolean>;

	async authenticateUser(
		user: User,
		options: AuthenticateOptions,
		emitStatus: (status: 'fail' | 'success') => void
	): Promise<AuthenticatedResponse> {
		const { ip, userAgent, otp } = options;

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

		const record = await this.knex
			.select<Session & { user: string; expires: string }>('user', 'expires')
			.from('directus_sessions')
			.where({ token: refreshToken })
			.first();

		if (!record || record.expires < new Date()) {
			throw new InvalidCredentialsException();
		}

		const accessToken = jwt.sign({ id: record.user }, env.SECRET as string, {
			expiresIn: env.ACCESS_TOKEN_TTL,
		});

		const newRefreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(Date.now() + ms(env.REFRESH_TOKEN_TTL as string));

		await this.knex('directus_sessions')
			.update({ token: newRefreshToken, expires: refreshTokenExpiration })
			.where({ token: refreshToken });

		await this.knex('directus_users').update({ last_access: new Date() }).where({ id: record.user });

		return {
			accessToken,
			refreshToken: newRefreshToken,
			expires: ms(env.ACCESS_TOKEN_TTL as string),
			id: record.user,
		};
	}

	async logout(refreshToken: string): Promise<void> {
		await this.knex.delete().from('directus_sessions').where({ token: refreshToken });
	}

	generateTFASecret(): string {
		return authenticator.generateSecret();
	}

	async generateOTPAuthURL(pk: string, secret: string): Promise<string> {
		const user = await this.knex.select('email').from('directus_users').where({ id: pk }).first();

		if (!user.email) {
			throw new InvalidPayloadException('User must have a valid email to enable TFA.');
		}

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
}
