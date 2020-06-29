import database from '../database';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { InvalidCredentialsException } from '../exceptions';

export const authenticate = async (email: string, password?: string) => {
	const user = await database
		.select('id', 'password', 'role')
		.from('directus_users')
		.where({ email })
		.first();

	if (!user) {
		throw new InvalidCredentialsException();
	}

	/**
	 * @NOTE
	 * This undefined check is on purpose so we can login through SSO without having to rely on
	 * password. However, this check might be a little tricky, as we don't want this login with just
	 * email to leak anywhere else.. We might have to make a dedicated "copy" of this function to
	 * signal the difference
	 */
	if (password !== undefined && (await bcrypt.compare(password, user.password)) === false) {
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
	const token = jwt.sign(payload, process.env.SECRET, {
		expiresIn: process.env.ACCESS_TOKEN_EXPIRY_TIME,
	});

	return token;
};
