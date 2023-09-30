import type { Accountability } from '@directus/types';
import { DEFAULT_AUTH_PROVIDER } from '../constants.js';
import { AuthenticationService } from '../services/index.js';
import { getAccountabilityForToken } from '../utils/get-accountability-for-token.js';
import { getPermissions } from '../utils/get-permissions.js';
import { getSchema } from '../utils/get-schema.js';
import { WebSocketError } from './errors.js';
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
		throw new WebSocketError('auth', 'AUTH_FAILED', 'Authentication failed.', message['uid']);
	}
}

export async function refreshAccountability(
	accountability: Accountability | null | undefined
): Promise<Accountability> {
	accountability = accountability ?? {
		role: null,
		user: null,
		admin: false,
		app: false,
	};

	const schema = await getSchema();
	const permissions = await getPermissions(accountability, schema);

	return { ...accountability, permissions };
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
