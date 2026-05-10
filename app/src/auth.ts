import {
	authenticateShare,
	AuthenticationData,
	getAuthEndpoint,
	LoginOptions,
	readMe,
	RestCommand,
} from '@directus/sdk';
import { useAppStore } from '@directus/stores';
import { useLocalStorage } from '@vueuse/core';
import { useCookies } from '@vueuse/integrations/useCookies';
import { RouteLocationRaw } from 'vue-router';
import { emitter, Events } from './events';
import { useServerStore } from './stores/server';
import { resumeQueue } from '@/api';
import { DEFAULT_AUTH_PROVIDER, SDK_AUTH_REFRESH_BEFORE_EXPIRES } from '@/constants';
import { dehydrate, hydrate } from '@/hydrate';
import { router } from '@/router';
import { sdk } from '@/sdk';

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
const ACCESS_TOKEN_EXPIRY_STORAGE_KEY = 'directus-access-token-expiry';
const MAX_SAFE_TIMEOUT = 2 ** 31 - 1;
const accessTokenExpiryStorage = useLocalStorage<number | null>(ACCESS_TOKEN_EXPIRY_STORAGE_KEY, null);

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

	setAccessTokenExpiry(appStore, Date.now() + (response.expires ?? 0));
	cookies.remove('license-banner-dismissed');
	appStore.authenticated = true;

	// Reload server store to get authenticated data
	serverStore.hydrate();

	await hydrate();
}

let idle = false;
let firstRefresh = true;
let scheduledRefresh: number | null = null;

// Prevent the auto-refresh when the app isn't in use
emitter.on(Events.tabIdle, () => {
	clearScheduledRefresh();
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
		if (await validateStoredSession(appStore)) return;

		clearScheduledRefresh();
		const response = await sdk.refresh();

		setAccessTokenExpiry(appStore, Date.now() + (response.expires ?? 0));
		appStore.authenticated = true;
		firstRefresh = false;
	} catch {
		// The failed request may have been sent with a stale session cookie while another tab was refreshing.
		try {
			if (await validateStoredSession(appStore)) return;
		} catch {
			// Fall through to the regular session-expired logout flow.
		}

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
	clearScheduledRefresh();
	clearAccessTokenExpiry(appStore);

	await dehydrate();

	if (logoutOptions.navigate === true) {
		const location: RouteLocationRaw = {
			path: `/login`,
			query: { reason: logoutOptions.reason },
		};

		router.push(location);
	}
}

async function validateStoredSession(appStore: ReturnType<typeof useAppStore>): Promise<boolean> {
	const accessTokenExpiry = Math.max(appStore.accessTokenExpiry, getStoredAccessTokenExpiry());

	if (!accessTokenExpiry || Date.now() >= accessTokenExpiry - SDK_AUTH_REFRESH_BEFORE_EXPIRES) return false;

	await sdk.request(readMe({ fields: ['id'] }));

	setAccessTokenExpiry(appStore, accessTokenExpiry);
	scheduleRefresh(accessTokenExpiry);
	appStore.authenticated = true;
	firstRefresh = false;

	return true;
}

function setAccessTokenExpiry(appStore: ReturnType<typeof useAppStore>, accessTokenExpiry: number): void {
	appStore.accessTokenExpiry = accessTokenExpiry;
	accessTokenExpiryStorage.value = accessTokenExpiry;
}

function clearAccessTokenExpiry(appStore: ReturnType<typeof useAppStore>): void {
	appStore.accessTokenExpiry = 0;
	accessTokenExpiryStorage.value = null;
}

function scheduleRefresh(accessTokenExpiry: number): void {
	clearScheduledRefresh();

	const delay = accessTokenExpiry - Date.now() - SDK_AUTH_REFRESH_BEFORE_EXPIRES;

	if (delay <= 0 || delay > MAX_SAFE_TIMEOUT) return;

	scheduledRefresh = window.setTimeout(() => {
		scheduledRefresh = null;

		refresh().catch(() => {
			// refresh handles session-expired state internally.
		});
	}, delay);
}

function clearScheduledRefresh(): void {
	if (!scheduledRefresh) return;

	window.clearTimeout(scheduledRefresh);
	scheduledRefresh = null;
}

function getStoredAccessTokenExpiry(): number {
	try {
		// Read storage directly so recovery sees cross-tab refreshes before the VueUse ref receives a storage event.
		const accessTokenExpiry = Number(localStorage.getItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY));

		return Number.isFinite(accessTokenExpiry) ? accessTokenExpiry : 0;
	} catch {
		return accessTokenExpiryStorage.value ?? 0;
	}
}
