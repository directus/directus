import database from '../database';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import ms from 'ms';
import { InvalidCredentialsException, InvalidPayloadException, InvalidOTPException } from '../exceptions';
import { Session, Accountability, AbstractServiceOptions, Action, SchemaOverview } from '../types';
import Knex from 'knex';
import { ActivityService } from '../services/activity';
import env from '../env';
import { authenticator } from 'otplib';
import emitter, { emitAsyncSafe } from '../emitter';
import { omit } from 'lodash';

type AuthenticateOptions = {
	email: string;
	password?: string;
	ip?: string | null;
	userAgent?: string | null;
	otp?: string;
	[key: string]: any;
};

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
	async authenticate(options: AuthenticateOptions) {
		const { email, password, ip, userAgent, otp } = options;

		const hookPayload = omit(options, 'password', 'otp');

		const user = await database
			.select('id', 'password', 'role', 'tfa_secret', 'status')
			.from('directus_users')
			.where({ email })
			.first();

		await emitter.emitAsync('auth.login.before', hookPayload, {
			event: 'auth.login.before',
			action: 'login',
			schema: this.schema,
			payload: hookPayload,
			accountability: this.accountability,
			status: 'pending',
			user: user?.id,
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
			});
		};

		if (!user || user.status !== 'active') {
			emitStatus('fail');
			throw new InvalidCredentialsException();
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

		if (this.accountability) {
			await this.activityService.create({
				action: Action.AUTHENTICATE,
				user: user.id,
				ip: this.accountability.ip,
				user_agent: this.accountability.userAgent,
				collection: 'directus_users',
				item: user.id,
			});
		}

		emitStatus('success');

		return {
			accessToken,
			refreshToken,
			expires: ms(env.ACCESS_TOKEN_TTL as string),
			id: user.id,
		};
	}

	async refresh(refreshToken: string) {
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

	async logout(refreshToken: string) {
		await this.knex.delete().from('directus_sessions').where({ token: refreshToken });
	}

	generateTFASecret() {
		const secret = authenticator.generateSecret();
		return secret;
	}

	async generateOTPAuthURL(pk: string, secret: string) {
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

	async verifyPassword(pk: string, password: string) {
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
