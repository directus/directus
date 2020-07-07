import database from '../database';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { nanoid } from 'nanoid';
import ms from 'ms';
import { InvalidCredentialsException } from '../exceptions';

type AuthenticateOptions = {
	email: string;
	password?: string;
	ip?: string;
	userAgent?: string;
};

/**
 * Retrieve the tokens for a given user email.
 *
 * Password is optional to allow usage of this function within the SSO flow and extensions. Make sure
 * to handle password existence checks elsewhere
 */
export const authenticate = async ({ email, password, ip, userAgent }: AuthenticateOptions) => {
	const user = await database
		.select('id', 'password', 'role')
		.from('directus_users')
		.where({ email })
		.first();

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
	const accessToken = jwt.sign(payload, process.env.SECRET, {
		expiresIn: process.env.ACCESS_TOKEN_TTL,
	});

	const refreshToken = nanoid(64);
	const refreshTokenExpiration = new Date(Date.now() + ms(process.env.REFRESH_TOKEN_TTL));

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
		expires: ms(process.env.ACCESS_TOKEN_TTL) / 1000,
		id: user.id,
		refreshTokenExpiration,
	};
};

export const refresh = async (refreshToken: string) => {};
