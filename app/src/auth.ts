import api, { resumeQueue } from '@/api';
import { DEFAULT_AUTH_PROVIDER } from '@/constants';
import { dehydrate, hydrate } from '@/hydrate';
import { router } from '@/router';
import { useAppStore } from '@directus/stores';
import { RouteLocationRaw } from 'vue-router';
import { idleTracker } from './idle';
import { type LoginOptions } from '@directus/sdk';
import sdk from './sdk';
import { useServerStore } from './stores/server';

type LoginCredentials = {
	identifier?: string;
	email?: string;
	password?: string;
	otp?: string;
	share?: string;
};

type LoginParams = {
	credentials: LoginCredentials;
	provider?: string;
	share?: boolean;
};

// TODO fix non-null assertions
export async function login({ credentials, provider, share }: LoginParams): Promise<void> {
	const appStore = useAppStore();
	const serverStore = useServerStore();

	const password = credentials.password;
	const email = share ? credentials.share : credentials.email;
	if (!password || !email) throw new Error('test');

	const options: LoginOptions = {};
	if (share) options.share = share;
	if (provider !== DEFAULT_AUTH_PROVIDER) options.provider = provider;
	if (credentials.otp) options.otp = credentials.otp;

	const response = await sdk.login(email, password, options);

	// Add the header to the API handler for every request
	api.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;

	appStore.accessTokenExpiry = Date.now() + (response.expires ?? 0);
	appStore.authenticated = true;

	// Reload server store to get authenticated data
	serverStore.hydrate();

	await hydrate();
}

let idle = false;
let firstRefresh = true;

// Prevent the auto-refresh when the app isn't in use
idleTracker.on('idle', () => {
	sdk.stopRefreshing();
	idle = true;
});

idleTracker.on('hide', () => {
	sdk.stopRefreshing();
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
	// Allow refresh during initial page load
	if (firstRefresh) firstRefresh = false;
	// Skip if not logged in
	else if (!api.defaults.headers.common['Authorization']) return;

	try {
		const response = await sdk.refresh();

		if (!response.access_token) throw new Error();

		// Add the header to the old API handler for every request
		api.defaults.headers.common['Authorization'] = `Bearer ${response.access_token}`;

		return response.access_token;
	} catch (error: any) {
		await logout({ navigate, reason: LogoutReason.SESSION_EXPIRED });
		return;
	} finally {
		resumeQueue();
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

	delete api.defaults.headers.common['Authorization'];

	sdk.stopRefreshing();

	const options = { ...defaultOptions, ...optionsRaw };

	// Only if the user manually signed out should we kill the session by hitting the logout endpoint
	if (options.reason === LogoutReason.SIGN_OUT) {
		try {
			await sdk.logout();
		} catch {
			// User already signed out
		}
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
