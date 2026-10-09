import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';
import ContinueAs from './continue-as.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import { hydrate } from '@/hydrate';

vi.mock('@/api');

vi.mock('@/hydrate', () => ({
	hydrate: vi.fn(),
}));

vi.mock('@/auth', () => ({
	logout: vi.fn(),
}));

vi.mock('@/utils/unexpected-error', () => ({
	unexpectedError: vi.fn(),
}));

const i18n = createI18n({ legacy: false });

// silences locale message not found warnings
vi.spyOn(i18n.global, 't').mockImplementation((key: any) => key);

let router: Router;
let hydrateResolvers: Array<() => void>;

/** Resolve every pending `hydrate()` call, then let the continuations run. */
async function resolveHydrate() {
	const resolvers = [...hydrateResolvers];
	hydrateResolvers = [];

	for (const resolve of resolvers) resolve();

	await flushPromises();
}

function mountContinueAs() {
	const global: GlobalMountOptions = {
		plugins: [i18n, router],
		stubs: { routerLink: true },
	};

	return mount(ContinueAs, { global, shallow: true });
}

beforeEach(async () => {
	vi.clearAllMocks();

	hydrateResolvers = [];

	vi.mocked(hydrate).mockImplementation(() => new Promise<void>((resolve) => hydrateResolvers.push(resolve)));

	vi.mocked(api.get).mockResolvedValue({
		data: { data: { email: 'admin@example.com', first_name: 'Ad', last_name: 'Min', last_page: '/file-view/xy' } },
	});

	router = createRouter({
		history: createMemoryHistory(),
		routes: [
			{ name: 'login', path: '/login', component: { template: '<div />' } },
			{ name: 'catch-all', path: '/:pathMatch(.*)*', component: { template: '<div />' } },
		],
	});

	await router.push('/login?redirect=/settings/data-model&continue=');
	await router.isReady();
});

test('navigates to the redirect query when continue is present', async () => {
	const push = vi.spyOn(router, 'push');

	mountContinueAs();
	await flushPromises();
	await resolveHydrate();

	expect(push).toHaveBeenCalledOnce();
	expect(push).toHaveBeenCalledWith('/settings/data-model');
});

test('navigates only once to the redirect query when the component re-mounts while hydrating', async () => {
	const push = vi.spyOn(router, 'push');

	// First mount starts hydrating
	mountContinueAs();
	await flushPromises();

	// Registering the module routes re-navigates and re-mounts the component mid-hydration
	mountContinueAs();
	await flushPromises();

	expect(push).not.toHaveBeenCalled();

	await resolveHydrate();

	expect(hydrate).toHaveBeenCalledOnce();
	expect(push).toHaveBeenCalledOnce();
	expect(push).toHaveBeenCalledWith('/settings/data-model');
	expect(router.currentRoute.value.fullPath).toBe('/settings/data-model');
});

test('navigates only once when the component re-mounts while the navigation is still pending', async () => {
	// Slow guard on the target, so the navigation stays in flight while we re-mount
	router.addRoute({
		name: 'slow-target',
		path: '/settings/data-model',
		component: { template: '<div />' },
		beforeEnter: () => new Promise<void>((resolve) => setTimeout(resolve, 10)).then(() => true),
	});

	const push = vi.spyOn(router, 'push');

	mountContinueAs();
	await flushPromises();
	await resolveHydrate();

	// Navigation has been started but has not settled yet
	expect(push).toHaveBeenCalledOnce();
	expect(router.currentRoute.value.name).toBe('login');

	mountContinueAs();
	await flushPromises();
	await resolveHydrate();

	expect(push).toHaveBeenCalledOnce();

	await vi.waitUntil(() => router.currentRoute.value.name === 'slow-target');

	expect(push).toHaveBeenCalledOnce();
	expect(router.currentRoute.value.fullPath).toBe('/settings/data-model');
});

test('navigates again on a later mount once the previous login finished', async () => {
	mountContinueAs();
	await flushPromises();
	await resolveHydrate();

	await router.push('/login?redirect=/users&continue=');

	const push = vi.spyOn(router, 'push');

	mountContinueAs();
	await flushPromises();
	await resolveHydrate();

	expect(push).toHaveBeenCalledOnce();
	expect(push).toHaveBeenCalledWith('/users');
});

test('uses the captured redirect when the query is dropped while hydrating', async () => {
	const push = vi.spyOn(router, 'push');

	mountContinueAs();
	await flushPromises();

	// Still on /login, but the redirect param is gone from the current route
	await router.replace('/login');

	await resolveHydrate();

	expect(push).toHaveBeenCalledWith('/settings/data-model');
});

test('falls back to last_page when there is no redirect query', async () => {
	await router.push('/login?continue=');

	const push = vi.spyOn(router, 'push');

	mountContinueAs();
	await flushPromises();
	await resolveHydrate();

	expect(push).toHaveBeenCalledWith('/file-view/xy');
});

test('falls back to /content when there is no redirect query and no last_page', async () => {
	vi.mocked(api.get).mockResolvedValue({
		data: { data: { email: 'admin@example.com', first_name: 'Ad', last_name: 'Min', last_page: null } },
	});

	await router.push('/login?continue=');

	const push = vi.spyOn(router, 'push');

	mountContinueAs();
	await flushPromises();
	await resolveHydrate();

	expect(push).toHaveBeenCalledWith('/content');
});

test('uses the first value when the redirect query is repeated', async () => {
	await router.push('/login?redirect=/settings/data-model&redirect=/users&continue=');

	const push = vi.spyOn(router, 'push');

	mountContinueAs();
	await flushPromises();
	await resolveHydrate();

	expect(push).toHaveBeenCalledWith('/settings/data-model');
});

test('does not navigate without the continue query until the button is clicked', async () => {
	await router.push('/login?redirect=/settings/data-model');

	const push = vi.spyOn(router, 'push');

	const wrapper = mountContinueAs();
	await flushPromises();

	expect(hydrate).not.toHaveBeenCalled();
	expect(push).not.toHaveBeenCalled();

	wrapper.findComponent(VButton).vm.$emit('click');
	await flushPromises();
	await resolveHydrate();

	expect(push).toHaveBeenCalledOnce();
	expect(push).toHaveBeenCalledWith('/settings/data-model');
});
