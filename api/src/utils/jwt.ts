import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { DirectusTokenPayload } from '../types';
import { InvalidTokenException, ServiceUnavailableException } from '../exceptions';

export function verifyAccessJWT(token: string, secret: string): DirectusTokenPayload {
	let payload;

	try {
		payload = jwt.verify(token, secret, {
			issuer: 'directus',
		}) as Record<string, any>;
	} catch (err) {
		if (err instanceof TokenExpiredError) {
			throw new InvalidTokenException('Token expired.');
		} else if (err instanceof JsonWebTokenError) {
			throw new InvalidTokenException('Token invalid.');
		} else {
			throw new ServiceUnavailableException(`Couldn't verify token.`, { service: 'jwt' });
		}
	}

	const { id, role, app_access, admin_access, share, share_scope } = payload;

	if (role === undefined || app_access === undefined || admin_access === undefined) {
		throw new InvalidTokenException('Invalid token payload.');
	}

	return { id, role, app_access, admin_access, share, share_scope };
}
