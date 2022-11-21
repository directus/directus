import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import * as auth from '@/auth';
import { useAppStore } from '@/stores/app';
import { useServerStore } from '@/stores/server';
import { useUserStore } from '@/stores/user';
import { afterEach, beforeEach, describe, expect, SpyInstance, test, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter, Router } from 'vue-router';

const testComponent = defineComponent({
	render: () => h('div'),
});

const nonPublicRoutes = ['first', 'second', 'third'].map((route) => ({
	name: route,
	path: `/${route}`,
	component: testComponent,
	meta: {}, // make sure 'meta.public' is not set so that they are tracked
}));

describe('router', () => {
	let router: Router;
	let authRefreshSpy: SpyInstance;

	beforeEach(async () => {
		setActivePinia(
			createTestingPinia({
				createSpy: vi.fn,
			})
		);

		const importedRouter = await import('./router');

		router = createRouter({
			history: createMemoryHistory(), // intentionally use memory for tests
			routes: [...importedRouter.defaultRoutes, ...nonPublicRoutes],
		});

		router.beforeEach(importedRouter.onBeforeEach);
		router.afterEach(importedRouter.onAfterEach);

		authRefreshSpy = vi.spyOn(auth, 'refresh').mockResolvedValue('');

		vi.spyOn(useServerStore(), 'hydrate').mockResolvedValue();
	});

	afterEach(() => {
		// Ensure the internal firstLoad variable in the imported router
		// is reset before every test
		vi.resetModules();
	});

	describe('onBeforeEach', () => {
		test('should try retrieving a fresh access token on first load', async () => {
			router.push('/');
			await router.isReady();

			expect(authRefreshSpy).toHaveBeenCalledOnce();
		});

		test('should not try retrieving a fresh access token after the first load', async () => {
			router.push('/');
			await router.isReady();

			// clear spy calls to ensure it's back to 0
			authRefreshSpy.mockClear();

			await router.push('/login');

			expect(authRefreshSpy).not.toHaveBeenCalled();
		});

		test('should not try retrieving a fresh access token after the first load', async () => {
			router.push('/');
			await router.isReady();

			// clear spy calls to ensure it's back to 0
			authRefreshSpy.mockClear();

			await router.push('/login');

			expect(authRefreshSpy).not.toHaveBeenCalled();
		});
	});

	describe('onAfterEach', () => {
		let userStoreTrackPageSpy: SpyInstance;

		beforeEach(() => {
			vi.useFakeTimers();
			userStoreTrackPageSpy = vi.spyOn(useUserStore(), 'trackPage').mockResolvedValue();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		test('should not trackPage for public routes', async () => {
			router.push('/');
			await router.isReady();

			expect(userStoreTrackPageSpy).not.toHaveBeenCalled();
		});

		test('should only trackPage once when routing multiple times before the setTimeout duration ends', async () => {
			router.push('/');
			await router.isReady();

			// mock authenticated to prevent redirection back to login page
			const appStore = useAppStore();
			appStore.authenticated = true;

			for (const route of nonPublicRoutes.map((route) => route.path)) {
				await router.push(route);
			}

			// advance past the trackTimeout duration
			vi.advanceTimersByTime(1000);
			expect(userStoreTrackPageSpy).toHaveBeenCalledOnce();
		});
	});
});
