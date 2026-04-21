import { useAppStore } from '@directus/stores';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter, Router } from 'vue-router';
import { _resetState, defaultRoutes, onAfterEach, onBeforeEach } from './router';

const { authLogout, authRefresh, serverStore, userStore } = vi.hoisted(() => ({
	authRefresh: vi.fn(),
	authLogout: vi.fn(),
	serverStore: {
		info: {
			project: null,
			setupCompleted: true,
			license_locked: false,
		},
		hydrate: vi.fn(),
	},
	userStore: {
		currentUser: null as any,
		isAdmin: false,
		trackPage: vi.fn(),
	},
}));

vi.mock('@/auth', () => ({
	refresh: authRefresh,
	logout: authLogout,
	LogoutReason: {
		SIGN_OUT: 'SIGN_OUT',
		SESSION_EXPIRED: 'SESSION_EXPIRED',
		PROJECT_LOCKED: 'PROJECT_LOCKED',
	},
}));

vi.mock('@/hydrate', () => ({
	hydrate: vi.fn(),
}));

vi.mock('@/stores/server', () => ({
	useServerStore: vi.fn().mockImplementation(() => serverStore),
}));

vi.mock('@/stores/user', () => ({
	useUserStore: vi.fn().mockImplementation(() => userStore),
}));

const testComponent = defineComponent({
	render: () => h('div'),
});

const nonPublicRoutes = ['first', 'second', 'third'].map((route) => ({
	name: route,
	path: `/${route}`,
	component: testComponent,
	meta: {},
}));

let router: Router;

function setupRouter() {
	vi.useRealTimers();

	setActivePinia(
		createTestingPinia({
			createSpy: vi.fn,
		}),
	);

	router = createRouter({
		history: createMemoryHistory(),
		routes: [...defaultRoutes, ...nonPublicRoutes],
	});

	router.beforeEach(onBeforeEach);
	router.afterEach(onAfterEach);
}

afterEach(() => {
	vi.clearAllMocks();
});

describe('onBeforeEach', () => {
	beforeEach(() => {
		_resetState();
		setupRouter();
		serverStore.info.license_locked = false;
		userStore.currentUser = null;
		userStore.isAdmin = false;
	});

	test('should try retrieving a fresh access token on first load', async () => {
		router.push('/');
		await router.isReady();

		expect(authRefresh).toHaveBeenCalledOnce();
	});

	test('should not try retrieving a fresh access token after the first load', async () => {
		router.push('/');
		await router.isReady();

		authRefresh.mockClear();

		await router.push('/login');

		expect(authRefresh).not.toHaveBeenCalled();
	});

	test('should redirect admins to /license-recovery when the project is locked', async () => {
		const appStore = useAppStore();
		appStore.hydrated = true;
		appStore.authenticated = true;
		serverStore.info.license_locked = true;
		userStore.currentUser = { admin_access: true };
		userStore.isAdmin = true;

		await router.push('/first');

		expect(router.currentRoute.value.fullPath).toBe('/license-recovery');
	});

	test('should leave /license-recovery once the project is unlocked', async () => {
		const appStore = useAppStore();
		appStore.hydrated = true;
		appStore.authenticated = true;
		serverStore.info.license_locked = false;
		userStore.currentUser = { admin_access: true };
		userStore.isAdmin = true;

		await router.push('/license-recovery');

		expect(router.currentRoute.value.fullPath).toBe('/settings/license');
	});

	test('should cleanly log out non-admins when the project is locked', async () => {
		const appStore = useAppStore();
		appStore.hydrated = true;
		appStore.authenticated = true;
		serverStore.info.license_locked = true;
		userStore.currentUser = { admin_access: false };
		userStore.isAdmin = false;

		await router.push('/first');

		expect(authLogout).toHaveBeenCalledWith({ navigate: false, reason: 'PROJECT_LOCKED' });
		expect(router.currentRoute.value.fullPath).toBe('/login?reason=PROJECT_LOCKED');
	});
});

describe('onAfterEach', () => {
	beforeEach(() => {
		setupRouter();
		serverStore.info.license_locked = false;
		userStore.currentUser = null;
		userStore.isAdmin = false;
	});

	test('should not trackPage for public routes', async () => {
		router.push('/');
		await router.isReady();

		expect(userStore.trackPage).not.toHaveBeenCalled();
	});

	test('should only trackPage once when routing multiple times before the setTimeout duration ends', async () => {
		router.push('/');
		await router.isReady();

		const appStore = useAppStore();
		appStore.hydrated = true;
		appStore.authenticated = true;

		vi.useFakeTimers();

		for (const route of nonPublicRoutes.map((configuredRoute) => configuredRoute.path)) {
			await router.push(route);
		}

		await vi.runOnlyPendingTimersAsync();
		expect(userStore.trackPage).toHaveBeenCalledOnce();

		vi.useRealTimers();
	});
});
