import { test, expect, beforeEach, vitest, vi } from 'vitest';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createI18n } from 'vue-i18n';

import { generateRouter } from '@/__utils__/router';
import { Directive, h } from 'vue';
import { Router } from 'vue-router';

import VForm from './v-form.vue';

let global: GlobalMountOptions;

beforeEach(async () => {
	const i18n = createI18n();

	global = {
		plugins: [i18n, createTestingPinia()],
	};
});

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

	const wrapper = mount(VForm, {
		global,
		props: {
			fields: [],
			collection: null,
			loading: false,
		},
		shallow: true,
	});

	expect(wrapper.html()).toMatchSnapshot();
});
