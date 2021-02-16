import { RawLocation } from 'vue-router';
import api from '@/api';
import { hydrate, dehydrate } from '@/hydrate';
import router from '@/router';
import { useAppStore } from '@/stores';

export type LoginCredentials = {
	email: string;
	password: string;
};

export async function login(credentials: LoginCredentials) {
	const appStore = useAppStore();

	const response = await api.post(`/auth/login`, {
		...credentials,
		mode: 'cookie',
	});

	const accessToken = response.data.data.access_token;

	// Add the header to the API handler for every request
	api.defaults.headers['Authorization'] = `Bearer ${accessToken}`;

	// Refresh the token 10 seconds before the access token expires. This means the user will stay
	// logged in without any noticable hickups or delays

	// setTimeout breaks with numbers bigger than 32bits. This ensures that we don't try refreshing
	// for tokens that last > 24 days. Ref #4054
	if (response.data.data.expires <= 2100000000) {
		setTimeout(() => refresh(), response.data.data.expires - 10000);
	}

	appStore.state.authenticated = true;

	await hydrate();
}

let refreshTimeout: any;

export async function refresh({ navigate }: LogoutOptions = { navigate: true }) {
	const appStore = useAppStore();

	try {
		const response = await api.post('/auth/refresh');

		const accessToken = response.data.data.access_token;

		// Add the header to the API handler for every request
		api.defaults.headers['Authorization'] = `Bearer ${accessToken}`;

		// Refresh the token 10 seconds before the access token expires. This means the user will stay
		// logged in without any noticable hickups or delays
		if (refreshTimeout) clearTimeout(refreshTimeout);

		// setTimeout breaks with numbers bigger than 32bits. This ensures that we don't try refreshing
		// for tokens that last > 24 days. Ref #4054
		if (response.data.data.expires <= 2100000000) {
			refreshTimeout = setTimeout(() => refresh(), response.data.data.expires - 10000);
		}
		appStore.state.authenticated = true;

		return accessToken;
	} catch (error) {
		await logout({ navigate, reason: LogoutReason.SESSION_EXPIRED });
	}
}

export enum LogoutReason {
	SIGN_OUT = 'SIGN_OUT',
	SESSION_EXPIRED = 'SESSION_EXPIRED',
}

export type LogoutOptions = {
	navigate?: boolean;
	reason?: LogoutReason;
};

/**
 * Everything that should happen when someone logs out, or is logged out through an external factor
 */
export async function logout(optionsRaw: LogoutOptions = {}) {
	const appStore = useAppStore();

	const defaultOptions: Required<LogoutOptions> = {
		navigate: true,
		reason: LogoutReason.SIGN_OUT,
	};

	delete api.defaults.headers.Authorization;

	const options = { ...defaultOptions, ...optionsRaw };

	// Only if the user manually signed out should we kill the session by hitting the logout endpoint
	if (options.reason === LogoutReason.SIGN_OUT) {
		await api.post(`/auth/logout`);
	}

	appStore.state.authenticated = false;

	await dehydrate();

	if (options.navigate === true) {
		const location: RawLocation = {
			path: `/login`,
			query: { reason: options.reason },
		};

		router.push(location);
	}
}
