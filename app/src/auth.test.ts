import { useAppStore } from '@directus/stores';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { SDK_AUTH_REFRESH_BEFORE_EXPIRES } from '@/constants';

const { dehydrate, readMe, resumeQueue, routerPush, sdk } = vi.hoisted(() => ({
	dehydrate: vi.fn(),
	readMe: vi.fn((query: Record<string, unknown>) => ({ query, type: 'read-me' })),
	resumeQueue: vi.fn(),
	routerPush: vi.fn(),
	sdk: {
		logout: vi.fn(),
		refresh: vi.fn(),
		request: vi.fn(),
		stopRefreshing: vi.fn(),
	},
}));

vi.mock('@directus/sdk', () => ({
	authenticateShare: vi.fn(),
	getAuthEndpoint: vi.fn(() => '/auth/login'),
	readMe,
}));

vi.mock('@vueuse/integrations/useCookies', () => ({
	useCookies: vi.fn(() => ({
		remove: vi.fn(),
	})),
}));

vi.mock('@/api', () => ({
	resumeQueue,
}));

vi.mock('@/hydrate', () => ({
	dehydrate,
	hydrate: vi.fn(),
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
		hydrate: vi.fn(),
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
const ACCESS_TOKEN_TTL = 60_000;
const NOW = new Date('2026-05-10T10:00:00.000Z');

async function loadAuth() {
	vi.resetModules();
	return import('./auth');
}

function setStoredAccessTokenExpiry(expiresAt = Date.now() + ACCESS_TOKEN_TTL) {
	localStorage.setItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY, String(expiresAt));

	return expiresAt;
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
	test('should validate a fresh stored session without refreshing the token', async () => {
		const expiresAt = setStoredAccessTokenExpiry();
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

	test('should refresh before a validated stored session expires', async () => {
		setStoredAccessTokenExpiry();
		sdk.request.mockResolvedValueOnce({});

		const { refresh } = await loadAuth();

		await refresh();

		sdk.refresh.mockResolvedValueOnce({ expires: ACCESS_TOKEN_TTL });

		await vi.advanceTimersByTimeAsync(ACCESS_TOKEN_TTL - SDK_AUTH_REFRESH_BEFORE_EXPIRES);

		const refreshedExpiresAt = Date.now() + ACCESS_TOKEN_TTL;

		expect(sdk.refresh).toHaveBeenCalledOnce();
		expect(localStorage.getItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY)).toBe(String(refreshedExpiresAt));
	});

	test('should persist the access token expiry after refreshing', async () => {
		sdk.refresh.mockResolvedValueOnce({ expires: ACCESS_TOKEN_TTL });

		const { refresh } = await loadAuth();

		await refresh();

		const expiresAt = Date.now() + ACCESS_TOKEN_TTL;
		const appStore = useAppStore();

		expect(localStorage.getItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY)).toBe(String(expiresAt));
		expect(appStore.authenticated).toBe(true);
		expect(appStore.accessTokenExpiry).toBe(expiresAt);
	});

	test('should recover if another tab refreshed the session after this tab sent a stale refresh request', async () => {
		const expiresAt = Date.now() + ACCESS_TOKEN_TTL;

		sdk.refresh.mockImplementationOnce(async () => {
			setStoredAccessTokenExpiry(expiresAt);
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
	test('should clear the persisted access token expiry', async () => {
		const appStore = useAppStore();
		appStore.accessTokenExpiry = setStoredAccessTokenExpiry();

		const { LogoutReason, logout } = await loadAuth();

		await logout({ navigate: false, reason: LogoutReason.SESSION_EXPIRED });

		expect(appStore.accessTokenExpiry).toBe(0);
		expect(localStorage.getItem(ACCESS_TOKEN_EXPIRY_STORAGE_KEY)).toBeNull();
	});
});
