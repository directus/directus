import jwt from 'jsonwebtoken';
import { InvalidTokenError, ServiceUnavailableError, TokenExpiredError } from '@directus/errors';
import type { DirectusTokenPayload } from '../types/index.js';

export function verifyJWT(token: string, secret: string): DirectusTokenPayload {
	let payload;

	try {
		payload = jwt.verify(token, secret, {
			issuer: 'directus',
		}) as DirectusTokenPayload;
	} catch (err) {
		if (err instanceof jwt.TokenExpiredError) {
			throw new TokenExpiredError();
		} else if (err instanceof jwt.JsonWebTokenError) {
			throw new InvalidTokenError();
		} else {
			throw new ServiceUnavailableError({ service: 'jwt', reason: `Couldn't verify token.` });
		}
	}

	return payload;
}

export function verifyAccessJWT(token: string, secret: string): DirectusTokenPayload {
	const payload = verifyJWT(token, secret);

	if (payload.role === undefined || payload.app_access === undefined || payload.admin_access === undefined) {
		throw new InvalidTokenError();
	}

	return payload;
}
