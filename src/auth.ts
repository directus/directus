import { RawLocation } from 'vue-router';
import api from '@/api';
import { hydrate, dehydrate } from '@/hydrate';
import router from '@/router';

/**
 * Check if the current user is authenticated to the current project
 */
export async function checkAuth() {
	/** @todo base this on existence of access token / response token  */
	return true;
	// try {
	// 	const response = await api.get(`/auth/check`);
	// 	return response.data.data.authenticated;
	// } catch {
	// 	return false;
	// }
}

export type LoginCredentials = {
	email: string;
	password: string;
};

export async function login(credentials: LoginCredentials) {
	const response = await api.post(`/auth/authenticate`, {
		...credentials,
		mode: 'cookie',
	});

	api.defaults.headers['Authorization'] = `Bearer ${response.data.data.token}`;

	await hydrate();
}

export enum LogoutReason {
	SIGN_OUT = 'SIGN_OUT',
	ERROR_SESSION_EXPIRED = 'ERROR_SESSION_EXPIRED',
}

export type LogoutOptions = {
	navigate?: boolean;
	reason?: LogoutReason;
};

/**
 * Everything that should happen when someone logs out, or is logged out through an external factor
 */
export async function logout(optionsRaw: LogoutOptions = {}) {
	const defaultOptions: Required<LogoutOptions> = {
		navigate: true,
		reason: LogoutReason.SIGN_OUT,
	};

	const options = { ...defaultOptions, ...optionsRaw };

	// Only if the user manually signed out should we kill the session by hitting the logout endpoint
	if (options.reason === LogoutReason.SIGN_OUT) {
		await api.post(`/auth/logout`);
	}

	await dehydrate();

	if (options.navigate === true) {
		const location: RawLocation = {
			path: `/login`,
			query: { reason: options.reason },
		};

		router.push(location);
	}
}
