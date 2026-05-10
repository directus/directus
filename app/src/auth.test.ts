import { useAppStore } from '@directus/stores';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { cookieRemove, dehydrate, hydrate, readMe, resumeQueue, routerPush, sdk, serverHydrate } = vi.hoisted(() => ({
	cookieRemove: vi.fn(),
	dehydrate: vi.fn(),
	hydrate: vi.fn(),
	readMe: vi.fn((query: Record<string, unknown>) => ({ query, type: 'read-me' })),
	resumeQueue: vi.fn(),
	routerPush: vi.fn(),
	sdk: {
		login: vi.fn(),
		logout: vi.fn(),
		refresh: vi.fn(),
		request: vi.fn(),
		stopRefreshing: vi.fn(),
	},
	serverHydrate: vi.fn(),
}));

vi.mock('@directus/sdk', () => ({
	authenticateShare: vi.fn(),
	getAuthEndpoint: vi.fn(() => '/auth/login'),
	readMe,
}));

vi.mock('@vueuse/integrations/useCookies', () => ({
	useCookies: vi.fn(() => ({
		remove: cookieRemove,
	})),
}));

vi.mock('@/api', () => ({
	resumeQueue,
}));

vi.mock('@/hydrate', () => ({
	dehydrate,
	hydrate,
}));

vi.mock('@/router', () => ({
	router: {
		push: routerPush,
	},
}));

vi.mock('@/sdk', () => ({
	sdk,
}));

vi.mock('@/stores/server', () => ({
	useServerStore: vi.fn(() => ({
		hydrate: serverHydrate,
	})),
}));

vi.mock('./events', () => ({
	emitter: {
		on: vi.fn(),
	},
	Events: {
		tabActive: 'tabActive',
		tabIdle: 'tabIdle',
	},
}));

const ACCESS_TOKEN_EXPIRY_STORAGE_KEY = 'directus-access-token-expiry';
const NOW = new Date('2026-05-10T10:00:00.000Z');

async function loadAuth() {
	vi.resetModules();
	return import('./auth');
}

beforeEach(() => {
	vi.useFakeTimers();
	vi.setSystemTime(NOW);
	vi.clearAllMocks();
	localStorage.clear();

	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);
});

afterEach(() => {
	vi.useRealTimers();
});

describe('refresh', () => {
	test('validates a fresh stored session without refreshing the token', async () => {
		const expiresAt = Date.now() + 60_000;
		localStorage.setItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY, String(expiresAt));
		sdk.request.mockResolvedValueOnce({});

		const { refresh } = await loadAuth();

		await refresh();

		const appStore = useAppStore();

		expect(sdk.refresh).not.toHaveBeenCalled();
		expect(readMe).toHaveBeenCalledWith({ fields: ['id'] });
		expect(sdk.request).toHaveBeenCalledWith({ query: { fields: ['id'] }, type: 'read-me' });
		expect(appStore.authenticated).toBe(true);
		expect(appStore.accessTokenExpiry).toBe(expiresAt);
		expect(resumeQueue).toHaveBeenCalledOnce();
	});

	test('refreshes before a validated stored session expires', async () => {
		const expiresAt = Date.now() + 60_000;
		localStorage.setItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY, String(expiresAt));
		sdk.request.mockResolvedValueOnce({});

		const { refresh } = await loadAuth();

		await refresh();

		sdk.refresh.mockResolvedValueOnce({ expires: 60_000 });

		await vi.advanceTimersByTimeAsync(50_000);

		const refreshedExpiresAt = Date.now() + 60_000;

		expect(sdk.refresh).toHaveBeenCalledOnce();
		expect(localStorage.getItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY)).toBe(String(refreshedExpiresAt));
	});

	test('persists the access token expiry after refreshing', async () => {
		sdk.refresh.mockResolvedValueOnce({ expires: 60_000 });

		const { refresh } = await loadAuth();

		await refresh();

		const expiresAt = Date.now() + 60_000;
		const appStore = useAppStore();

		expect(localStorage.getItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY)).toBe(String(expiresAt));
		expect(appStore.authenticated).toBe(true);
		expect(appStore.accessTokenExpiry).toBe(expiresAt);
	});

	test('recovers when another tab refreshed the session after this tab sent a stale refresh request', async () => {
		const expiresAt = Date.now() + 60_000;

		sdk.refresh.mockImplementationOnce(async () => {
			localStorage.setItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY, String(expiresAt));
			throw new Error('Invalid credentials');
		});

		sdk.request.mockResolvedValueOnce({});

		const { refresh } = await loadAuth();

		await refresh();

		const appStore = useAppStore();

		expect(sdk.refresh).toHaveBeenCalledOnce();
		expect(sdk.request).toHaveBeenCalledWith({ query: { fields: ['id'] }, type: 'read-me' });
		expect(appStore.authenticated).toBe(true);
		expect(routerPush).not.toHaveBeenCalled();
		expect(dehydrate).not.toHaveBeenCalled();
	});
});

describe('logout', () => {
	test('clears the persisted access token expiry', async () => {
		const appStore = useAppStore();
		appStore.accessTokenExpiry = Date.now() + 60_000;
		localStorage.setItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY, String(appStore.accessTokenExpiry));

		const { LogoutReason, logout } = await loadAuth();

		await logout({ navigate: false, reason: LogoutReason.SESSION_EXPIRED });

		expect(appStore.accessTokenExpiry).toBe(0);
		expect(localStorage.getItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY)).toBeNull();
	});
});
