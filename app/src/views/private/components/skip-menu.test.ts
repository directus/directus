import SkipMenu from './skip-menu.vue';
import { generateRouter } from '@/__utils__/router';
import type { GlobalMountOptions } from '@/__utils__/types';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import { i18n } from '@/lang';
import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { beforeEach, expect, test, vi } from 'vitest';
import { h } from 'vue';

let global: GlobalMountOptions;

beforeEach(async () => {
	const router = generateRouter();
	router.push('/');
	await router.isReady();

	global = {
		components: {
			VListItem,
			VList,
		},
		plugins: [
			router,
			i18n,
			createTestingPinia({
				createSpy: vi.fn,
			}),
		],
	};
});

test('Mount component', () => {
	expect(SkipMenu).toBeTruthy();

	const wrapper = mount(SkipMenu, {
		props: { section: 'main-content' },
		global,
	});

	expect(wrapper.html()).toMatchInlineSnapshot(
		`"<ul data-v-ff20e609="" data-v-448f74d2="" class="v-list skip-menu center"><a data-v-6ff80cef="" data-v-448f74d2="" data-v-ff20e609-s="" class="v-list-item link" href="/#navigation" target="_self" rel="noopener noreferrer">Skip to Navigation</a><a data-v-6ff80cef="" data-v-448f74d2="" data-v-ff20e609-s="" class="v-list-item link" href="/#module-navigation" target="_self" rel="noopener noreferrer">Skip to Module Navigation</a><a data-v-6ff80cef="" data-v-448f74d2="" data-v-ff20e609-s="" class="v-list-item link" href="/#sidebar" target="_self" rel="noopener noreferrer">Skip to Sidebar</a></ul>"`,
	);
});

test('href is correct when router is at /admin/content/pages/', async () => {
	const router = generateRouter([
		{
			path: '/admin/content/pages/',
			component: h('div'),
		},
	]);

	router.push('/admin/content/pages/');
	await router.isReady();

	const wrapper = mount(SkipMenu, {
		props: { section: 'sidebar' },
		global: {
			...global,
			plugins: [router, i18n],
		},
	});

	const mainLink = wrapper.findAll('a').find((a) => a?.attributes('href')?.includes('#main-content'));
	expect(mainLink).toBeTruthy();
	expect(mainLink?.attributes('href')).toBe('/admin/content/pages/#main-content');
});
