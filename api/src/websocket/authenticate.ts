import type { Accountability } from '@directus/types';
import { DEFAULT_AUTH_PROVIDER } from '../constants.js';
import getDatabase from '../database/index.js';
import { InvalidCredentialsException } from '../exceptions/index.js';
import { AuthenticationService } from '../services/index.js';
import { getAccountabilityForRole } from '../utils/get-accountability-for-role.js';
import { getAccountabilityForToken } from '../utils/get-accountability-for-token.js';
import { getSchema } from '../utils/get-schema.js';
import { WebSocketException } from './exceptions.js';
import type { BasicAuthMessage, WebSocketResponse } from './messages.js';
import type { AuthenticationState } from './types.js';
import { getExpiresAtForToken } from './utils/get-expires-at-for-token.js';

export async function authenticateConnection(
	message: BasicAuthMessage & Record<string, any>
): Promise<AuthenticationState> {
	let access_token: string | undefined, refresh_token: string | undefined;

	try {
		if ('email' in message && 'password' in message) {
			const authenticationService = new AuthenticationService({ schema: await getSchema() });
			const { accessToken, refreshToken } = await authenticationService.login(DEFAULT_AUTH_PROVIDER, message);
			access_token = accessToken;
			refresh_token = refreshToken;
		}

		if ('refresh_token' in message) {
			const authenticationService = new AuthenticationService({ schema: await getSchema() });
			const { accessToken, refreshToken } = await authenticationService.refresh(message.refresh_token);
			access_token = accessToken;
			refresh_token = refreshToken;
		}

		if ('access_token' in message) {
			access_token = message.access_token;
		}

		if (!access_token) throw new Error();
		const accountability = await getAccountabilityForToken(access_token);
		const expires_at = getExpiresAtForToken(access_token);
		return { accountability, expires_at, refresh_token } as AuthenticationState;
	} catch (error) {
		if (error instanceof InvalidCredentialsException && error.message === 'Token expired.') {
			throw new WebSocketException('auth', 'TOKEN_EXPIRED', 'Token expired.', message['uid']);
		}

		throw new WebSocketException('auth', 'AUTH_FAILED', 'Authentication failed.', message['uid']);
	}
}

export async function refreshAccountability(
	accountability: Accountability | null | undefined
): Promise<Accountability> {
	const result: Accountability = await getAccountabilityForRole(accountability?.role || null, {
		accountability: accountability || null,
		schema: await getSchema(),
		database: getDatabase(),
	});

	result.user = accountability?.user || null;
	return result;
}

export function authenticationSuccess(uid?: string | number, refresh_token?: string): string {
	const message: WebSocketResponse = {
		type: 'auth',
		status: 'ok',
	};

	if (uid !== undefined) {
		message.uid = uid;
	}

	if (refresh_token !== undefined) {
		message['refresh_token'] = refresh_token;
	}

	return JSON.stringify(message);
}
