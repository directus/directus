import database from '../database';
import APIError, { ErrorCode } from '../error';
import jwt from 'jsonwebtoken';

export const authenticate = async (email: string, password: string) => {
	const user = await database
		.select('id', 'password', 'role')
		.from('directus_users')
		.where({ email })
		.first();

	if (!user) {
		throw new APIError(ErrorCode.INVALID_USER_CREDENTIALS, 'Invalid user credentials');
	}

	/** @TODO implement password hash */
	if (password !== user.password) {
		throw new APIError(ErrorCode.INVALID_USER_CREDENTIALS, 'Invalid user credentials');
	}

	const payload = {
		id: user.id,
	};

	/**
	 * @TODO
	 * Sign token with combination of server secret + user password hash
	 * That way, old tokens are immediately invalidated whenever the user changes their password
	 */
	const token = jwt.sign(payload, process.env.SECRET, {
		expiresIn: process.env.ACCESS_TOKEN_EXPIRY_TIME,
	});

	return token;
};
