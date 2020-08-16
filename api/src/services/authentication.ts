import database from '../database';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import ms from 'ms';
import { InvalidCredentialsException, InvalidPayloadException } from '../exceptions';
import { Session, Accountability, AbstractServiceOptions, Action } from '../types';
import Knex from 'knex';
import ActivityService from '../services/activity';
import env from '../env';
import { customAlphabet } from 'nanoid';
import url from 'url';
import base32 from 'hi-base32';

type AuthenticateOptions = {
	email: string;
	password?: string;
	ip?: string | null;
	userAgent?: string | null;
	otp?: string;
};

export default class AuthenticationService {
	knex: Knex;
	accountability: Accountability | null;
	activityService: ActivityService;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
		this.activityService = new ActivityService();
	}

	/**
	 * Retrieve the tokens for a given user email.
	 *
	 * Password is optional to allow usage of this function within the SSO flow and extensions. Make sure
	 * to handle password existence checks elsewhere
	 */
	async authenticate({ email, password, ip, userAgent, otp }: AuthenticateOptions) {
		const user = await database
			.select('id', 'password', 'role', 'tfa_secret', 'status')
			.from('directus_users')
			.where({ email })
			.first();

		if (!user || user.status !== 'active') {
			throw new InvalidCredentialsException();
		}

		if (password !== undefined && (await argon2.verify(user.password, password)) === false) {
			throw new InvalidCredentialsException();
		}

		if (user.tfa_secret && !otp) {
			throw new InvalidPayloadException(`"otp" is required`);
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
				action_by: user.id,
				ip: this.accountability.ip,
				user_agent: this.accountability.userAgent,
				collection: 'directus_users',
				item: user.id,
			});
		}

		return {
			accessToken,
			refreshToken,
			expires: ms(env.ACCESS_TOKEN_TTL as string) / 1000,
			id: user.id,
		};
	}

	async refresh(refreshToken: string) {
		if (!refreshToken) {
			throw new InvalidCredentialsException();
		}

		const record = await database
			.select<Session & { email: string }>('directus_sessions.*', 'directus_users.email')
			.from('directus_sessions')
			.where({ 'directus_sessions.token': refreshToken })
			.leftJoin('directus_users', 'directus_sessions.user', 'directus_users.id')
			.first();

		/** @todo
		 * Check if it's worth checking for ip address and/or user agent. We could make this a little
		 * more secure by requiring the refresh token to be used from the same device / location as the
		 * auth session was created in the first place
		 */

		if (!record || !record.email || record.expires < new Date()) {
			throw new InvalidCredentialsException();
		}

		await this.knex.delete().from('directus_sessions').where({ token: refreshToken });

		return await this.authenticate({
			email: record.email,
			ip: record.ip,
			userAgent: record.user_agent,
		});
	}

	async logout(refreshToken: string) {
		await this.knex.delete().from('directus_sessions').where({ token: refreshToken });
	}

	generateTFASecret() {
		const set = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz!@#$%^&*()<>?/[]{},.:;';
		const nanoid = customAlphabet(set, 32);
		return nanoid();
	}

	async generateOTPAuthURL(secret: string) {
		const settings = await this.knex.select('project_name').from('directus_settings').first();
		const label = settings?.project_name || 'Directus';

		const urlSecret = base32.encode(secret);

		const query = {
			secret: urlSecret,
			algorithm: 'SHA1',
			digits: 6,
			period: 30,
		};

		return url.format({
			protocol: 'otpauth',
			slashes: true,
			hostname: 'totp',
			pathname: encodeURIComponent(label),
			query
		});
	}

	verifyOTP(secret: string, token: string): boolean {
		return true;
	}
}
