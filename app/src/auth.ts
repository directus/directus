import api from '@/api';
import { dehydrate, hydrate } from '@/hydrate';
import { router } from '@/router';
import { useAppStore } from '@/stores';
import { RouteLocationRaw } from 'vue-router';
import { idleTracker } from './idle';

export type LoginCredentials = {
	email: string;
	password: string;
};

export async function login(credentials: LoginCredentials): Promise<void> {
	const appStore = useAppStore();

	const response = await api.post<any>(`/auth/login`, {
		...credentials,
		mode: 'cookie',
	});

	const accessToken = response.data.data.access_token;

	if (!api.defaults.headers) {
		api.defaults.headers = {};
	}

	// Add the header to the API handler for every request
	api.defaults.headers['Authorization'] = `Bearer ${accessToken}`;

	// Refresh the token 10 seconds before the access token expires. This means the user will stay
	// logged in without any noticable hickups or delays

	// setTimeout breaks with numbers bigger than 32bits. This ensures that we don't try refreshing
	// for tokens that last > 24 days. Ref #4054
	if (response.data.data.expires <= 2100000000) {
		refreshTimeout = setTimeout(() => refresh(), response.data.data.expires - 10000);
	}

	appStore.accessTokenExpiry = Date.now() + response.data.data.expires;
	appStore.authenticated = true;

	await hydrate();
}

let refreshTimeout: any;
let idle = false;
let isRefreshing = false;

// Prevent the auto-refresh when the app isn't in use
idleTracker.on('idle', () => {
	clearTimeout(refreshTimeout);
	idle = true;
});

idleTracker.on('hide', () => {
	clearTimeout(refreshTimeout);
	idle = true;
});

// Restart the autorefresh process when the app is used (again)
idleTracker.on('active', () => {
	if (idle === true) {
		refresh();
		idle = false;
	}
});

idleTracker.on('show', () => {
	if (idle === true) {
		refresh();
		idle = false;
	}
});

export async function refresh({ navigate }: LogoutOptions = { navigate: true }): Promise<string | undefined> {
	// Skip if not logged in
	if (!api.defaults.headers?.['Authorization']) return;

	// Prevent concurrent refreshes
	if (isRefreshing) return;

	isRefreshing = true;

	const appStore = useAppStore();

	// Skip refresh if access token is still fresh
	if (appStore.accessTokenExpiry && Date.now() < appStore.accessTokenExpiry - 10000) {
		return;
	}

	try {
		const response = await api.post<any>('/auth/refresh', { headers: { Authorization: undefined } });

		const accessToken = response.data.data.access_token;

		// Add the header to the API handler for every request
		api.defaults.headers['Authorization'] = `Bearer ${accessToken}`;

		// Refresh the token 10 seconds before the access token expires. This means the user will stay
		// logged in without any notable hiccups or delays
		if (refreshTimeout) clearTimeout(refreshTimeout);

		// setTimeout breaks with numbers bigger than 32bits. This ensures that we don't try refreshing
		// for tokens that last > 24 days. Ref #4054
		if (response.data.data.expires <= 2100000000) {
			refreshTimeout = setTimeout(() => refresh(), response.data.data.expires - 10000);
		}

		appStore.accessTokenExpiry = Date.now() + response.data.data.expires;
		appStore.authenticated = true;

		return accessToken;
	} catch (error: any) {
		await logout({ navigate, reason: LogoutReason.SESSION_EXPIRED });
	} finally {
		isRefreshing = false;
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
export async function logout(optionsRaw: LogoutOptions = {}): Promise<void> {
	const appStore = useAppStore();

	const defaultOptions: Required<LogoutOptions> = {
		navigate: true,
		reason: LogoutReason.SIGN_OUT,
	};

	delete api.defaults.headers?.Authorization;

	clearTimeout(refreshTimeout);

	const options = { ...defaultOptions, ...optionsRaw };

	// Only if the user manually signed out should we kill the session by hitting the logout endpoint
	if (options.reason === LogoutReason.SIGN_OUT) {
		await api.post(`/auth/logout`);
	}

	appStore.authenticated = false;

	await dehydrate();

	if (options.navigate === true) {
		const location: RouteLocationRaw = {
			path: `/login`,
			query: { reason: options.reason },
		};

		router.push(location);
	}
}
