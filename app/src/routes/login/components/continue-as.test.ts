import { useAppStore } from '@directus/stores';
import { createTestingPinia } from '@pinia/testing';
import { flushPromises, mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, expect, test, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import { createRouter, createWebHistory, type Router } from 'vue-router';
import ContinueAs from './continue-as.vue';
import type { GlobalMountOptions } from '@/__utils__/types';

const { pendingUserRequests } = vi.hoisted(() => ({ pendingUserRequests: [] as ((value: unknown) => void)[] }));

vi.mock('@/api', () => ({
	default: {
		get: () => new Promise((resolve) => pendingUserRequests.push(resolve)),
	},
}));

vi.mock('@/hydrate', () => ({
	hydrate: async () => {
		const appStore = useAppStore();
		if (appStore.hydrated) return;

		appStore.hydrating = true;
		await nextTick();
		appStore.hydrating = false;
		appStore.hydrated = true;
	},
}));

const i18n = createI18n({ legacy: false });

// silences locale message not found warnings
vi.spyOn(i18n.global, 't').mockImplementation((key: any) => key);

let router: Router;

function resolveUserRequest() {
	const resolve = pendingUserRequests.shift();
	resolve!({ data: { data: { email: 'admin@example.com', last_page: '/users' } } });
}

beforeEach(() => {
	pendingUserRequests.length = 0;

	setActivePinia(createTestingPinia({ createSpy: vi.fn, stubActions: false }));

	router = createRouter({
		history: createWebHistory(),
		routes: [
			{ path: '/login', component: { template: '<div />' } },
			{ path: '/logout', component: { template: '<div />' } },
			{ path: '/users', component: { template: '<div />' } },
			{ path: '/settings/data-model', component: { template: '<div />' } },
		],
	});
});

test('navigates to the redirect query when remounted by the hydration state', async () => {
	// mirrors app.vue, which unmounts the router view while the app store is hydrating
	const AppRoot = defineComponent({
		components: { ContinueAs },
		setup: () => ({ appStore: useAppStore() }),
		template: '<ContinueAs v-if="!appStore.hydrating" />',
	});

	const global: GlobalMountOptions = { plugins: [i18n, router] };

	router.push('/login?redirect=/settings/data-model&continue=');
	await router.isReady();

	mount(AppRoot, { global });
	await flushPromises();

	expect(pendingUserRequests).toHaveLength(2);

	resolveUserRequest();
	await flushPromises();

	expect(router.currentRoute.value.fullPath).toBe('/settings/data-model');

	resolveUserRequest();
	await flushPromises();

	expect(router.currentRoute.value.fullPath).toBe('/settings/data-model');
});
