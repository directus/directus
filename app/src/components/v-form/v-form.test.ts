import { test, expect, beforeEach, vitest, vi } from 'vitest';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createI18n } from 'vue-i18n';

import { generateRouter } from '@/__utils__/router';
import { Directive, h } from 'vue';
import { Router } from 'vue-router';

import VForm from './v-form.vue';

let router: Router;
let global: GlobalMountOptions;

// beforeEach(async () => {
// 	router = generateRouter([
// 		{
// 			path: '/',
// 			component: h('div', VForm),
// 		},
// 		{
// 			path: '/test',
// 			component: h('div', 'empty'),
// 		},
// 	]);
// 	router.push('/');
// });

vi.stubGlobal(
	'ResizeObserver',
	vi.fn(() => ({
		disconnect: vi.fn(),
		observe: vi.fn(),
		takeRecords: vi.fn(),
		unobserve: vi.fn(),
	}))
);

test('Mount component', () => {
	expect(VForm).toBeTruthy();

	const i18n = createI18n();

	const wrapper = mount(VForm, {
		global: {
			plugins: [i18n, createTestingPinia()],
		},
		props: {
			fields: [],
			collection: null,
			loading: false,
		},
		shallow: true,
	});

	expect(wrapper.html()).not.toBe('');
});
