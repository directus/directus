import { test, expect, beforeEach, vitest, vi } from 'vitest';
import { GlobalMountOptions } from '@vue/test-utils/dist/types';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createI18n } from 'vue-i18n';
import { Directive, h } from 'vue';

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

test('Render text field', () => {
	// this correctly fails for the issue introduced by https://github.com/directus/directus/pull/15144
	const wrapper = mount(VForm, {
		global,
		props: {
			fields: [
				{
					collection: 'test',
					field: 'test',
					type: 'string',
					meta: {
						collection: 'test',
						field: 'test',
						special: null,
						interface: 'input',
						options: null,
						display: null,
						display_options: null,
						readonly: false,
						hidden: false,
						sort: null,
						width: 'full',
						translations: null,
						note: null,
						conditions: null,
						required: false,
						group: null,
						validation: null,
						validation_message: null,
					},
				},
			],
			collection: null,
			loading: false,
		},
		shallow: true,
	});

	expect(wrapper.html()).toMatchSnapshot();
});
