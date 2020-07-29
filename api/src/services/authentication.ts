import database from '../database';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import ms from 'ms';
import { InvalidCredentialsException } from '../exceptions';
import { Session, Accountability, AbstractServiceOptions } from '../types';
import Knex from 'knex';

type AuthenticateOptions = {
	email: string;
	password?: string;
	ip?: string | null;
	userAgent?: string | null;
};

export default class AuthenticationService {
	knex: Knex;
	accountability: Accountability | null;

	constructor(options?: AbstractServiceOptions) {
		this.knex = options?.knex || database;
		this.accountability = options?.accountability || null;
	}

	/**
	 * Retrieve the tokens for a given user email.
	 *
	 * Password is optional to allow usage of this function within the SSO flow and extensions. Make sure
	 * to handle password existence checks elsewhere
	 */
	async authenticate({ email, password, ip, userAgent }: AuthenticateOptions) {
		const user = await database
			.select('id', 'password', 'role')
			.from('directus_users')
			.where({ email })
			.first();

		/** @todo check for status */

		if (!user) {
			throw new InvalidCredentialsException();
		}

		if (password !== undefined && (await argon2.verify(user.password, password)) === false) {
			throw new InvalidCredentialsException();
		}

		const payload = {
			id: user.id,
		};

		/**
		 * @TODO
		 * Sign token with combination of server secret + user password hash
		 * That way, old tokens are immediately invalidated whenever the user changes their password
		 */
		const accessToken = jwt.sign(payload, process.env.SECRET as string, {
			expiresIn: process.env.ACCESS_TOKEN_TTL,
		});

		const refreshToken = nanoid(64);
		const refreshTokenExpiration = new Date(
			Date.now() + ms(process.env.REFRESH_TOKEN_TTL as string)
		);

		await database('directus_sessions').insert({
			token: refreshToken,
			user: user.id,
			expires: refreshTokenExpiration,
			ip,
			user_agent: userAgent,
		});

		return {
			accessToken,
			refreshToken,
			expires: ms(process.env.ACCESS_TOKEN_TTL as string) / 1000,
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
}
