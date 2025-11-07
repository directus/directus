import { resumeQueue } from '@/api';
import { DEFAULT_AUTH_PROVIDER, SDK_AUTH_REFRESH_BEFORE_EXPIRES } from '@/constants';
import { dehydrate, hydrate } from '@/hydrate';
import { router } from '@/router';
import { sdk } from '@/sdk';
import {
	AuthenticationData,
	LoginOptions,
	RestCommand,
	authenticateShare,
	getAuthEndpoint,
	readMe,
} from '@directus/sdk';
import { useAppStore } from '@directus/stores';
import { RouteLocationRaw } from 'vue-router';
import { Events, emitter } from './events';
import { useServerStore } from './stores/server';
import { useCookies } from '@vueuse/integrations/useCookies';

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

const cookies = useCookies(['license-banner-dismissed']);

export async function login({ credentials, provider, share }: LoginParams): Promise<void> {
	const appStore = useAppStore();
	const serverStore = useServerStore();

	let response: AuthenticationData;

	if (share) {
		const { share, password } = credentials;
		if (!share) throw new Error('Missing share ID');

		await sdk.request(authenticateShare(share, password, 'session'));
		// To initialize auto-refresh
		response = await sdk.refresh();
	} else {
		const { email, identifier, password, otp } = credentials;

		if (!password) throw new Error('Missing password');

		const loginOptions: LoginOptions = { otp, ...(provider !== DEFAULT_AUTH_PROVIDER && { provider }) };

		if (email) {
			response = await sdk.login({ email, password }, loginOptions);
		} else if (identifier) {
			const login =
				<Schema extends object>(): RestCommand<AuthenticationData, Schema> =>
				() => {
					const path = getAuthEndpoint(loginOptions.provider);
					const data = { identifier, password, otp, mode: 'session' };
					return { path, method: 'POST', body: JSON.stringify(data) };
				};

			await sdk.request(login());
			// To initialize auto-refresh
			response = await sdk.refresh();
		} else {
			throw new Error('Missing email or identifier');
		}
	}

	appStore.accessTokenExpiry = Date.now() + (response.expires ?? 0);
	cookies.remove('license-banner-dismissed');
	appStore.authenticated = true;

	// Reload server store to get authenticated data
	serverStore.hydrate();

	await hydrate();
}

let idle = false;
let firstRefresh = true;

// Prevent the auto-refresh when the app isn't in use
emitter.on(Events.tabIdle, () => {
	sdk.stopRefreshing();
	idle = true;
});

// Restart the auto-refresh process when the app is used again
emitter.on(Events.tabActive, () => {
	if (idle === true) {
		refresh();
		idle = false;
	}
});

export async function refresh({ navigate }: LogoutOptions = { navigate: true }): Promise<void> {
	const appStore = useAppStore();

	// Allow refresh during initial page load, skip if not logged in
	if (!firstRefresh && !appStore.authenticated) return;

	try {
		// Skip access token refreshing if it is still fresh but validate the session
		if (appStore.accessTokenExpiry && Date.now() < appStore.accessTokenExpiry - SDK_AUTH_REFRESH_BEFORE_EXPIRES) {
			await sdk.request(readMe({ fields: ['id'] }));
			return;
		}

		const response = await sdk.refresh();

		appStore.accessTokenExpiry = Date.now() + (response.expires ?? 0);
		appStore.authenticated = true;
		firstRefresh = false;
	} catch {
		await logout({ navigate, reason: LogoutReason.SESSION_EXPIRED });
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
export async function logout(options: LogoutOptions = {}): Promise<void> {
	const appStore = useAppStore();

	const defaultOptions: Required<LogoutOptions> = {
		navigate: true,
		reason: LogoutReason.SIGN_OUT,
	};

	const logoutOptions = { ...defaultOptions, ...options };

	sdk.stopRefreshing();

	// Only if the user manually signed out should we kill the session by hitting the logout endpoint
	if (logoutOptions.reason === LogoutReason.SIGN_OUT) {
		try {
			await sdk.logout();
		} catch {
			// User already signed out
		}
	}

	appStore.authenticated = false;

	await dehydrate();

	if (logoutOptions.navigate === true) {
		const location: RouteLocationRaw = {
			path: `/login`,
			query: { reason: logoutOptions.reason },
		};

		router.push(location);
	}
}
