import { useAppStore } from '@directus/stores';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter, Router } from 'vue-router';
import { _resetState, defaultRoutes, onAfterEach, onBeforeEach } from './router';

// Create mock functions before vi.mock hoisting
const { authRefresh, userStoreTrackPage } = vi.hoisted(() => ({
	authRefresh: vi.fn(),
	userStoreTrackPage: vi.fn(),
}));

vi.mock('@/auth', () => ({
	refresh: authRefresh,
}));

vi.mock('@/hydrate', () => ({
	hydrate: vi.fn(),
}));

vi.mock('@/stores/server', () => ({
	useServerStore: vi.fn().mockReturnValue({
		info: {
			project: null,
			setupCompleted: true,
		},
		hydrate: vi.fn(),
	}),
}));

vi.mock('@/stores/user', () => ({
	useUserStore: vi.fn().mockImplementation(() => {
		return {
			trackPage: userStoreTrackPage,
		};
	}),
}));

const testComponent = defineComponent({
	render: () => h('div'),
});

const nonPublicRoutes = ['first', 'second', 'third'].map((route) => ({
	name: route,
	path: `/${route}`,
	component: testComponent,
	meta: {}, // make sure 'meta.public' is not set so that they are tracked
}));

let router: Router;

function setupRouter() {
	// Ensure real timers are active - fake timers from other tests can leak
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
	});

	test('should try retrieving a fresh access token on first load', async () => {
		router.push('/');
		await router.isReady();

		expect(authRefresh).toHaveBeenCalledOnce();
	});

	test('should not try retrieving a fresh access token after the first load', async () => {
		router.push('/');
		await router.isReady();

		// clear calls since there was an initial auth refresh
		authRefresh.mockClear();

		await router.push('/login');

		expect(authRefresh).not.toHaveBeenCalled();
	});

	test('should not try retrieving a fresh access token after the first load', async () => {
		router.push('/');
		await router.isReady();

		// clear calls since there was an initial auth refresh
		authRefresh.mockClear();

		await router.push('/login');

		expect(authRefresh).not.toHaveBeenCalled();
	});
});

describe('onAfterEach', () => {
	beforeEach(() => {
		setupRouter();
	});

	test('should not trackPage for public routes', async () => {
		router.push('/');
		await router.isReady();

		expect(userStoreTrackPage).not.toHaveBeenCalled();
	});

	test('should only trackPage once when routing multiple times before the setTimeout duration ends', async () => {
		router.push('/');
		await router.isReady();

		// mock authenticated to prevent redirection back to login page
		const appStore = useAppStore();
		appStore.hydrated = true;
		appStore.authenticated = true;

		// Enable fake timers after initial navigation is complete
		vi.useFakeTimers();

		for (const route of nonPublicRoutes.map((route) => route.path)) {
			await router.push(route);
		}

		// advance past the trackTimeout duration
		vi.advanceTimersByTime(1000);
		expect(userStoreTrackPage).toHaveBeenCalledOnce();

		vi.useRealTimers();
	});
});
