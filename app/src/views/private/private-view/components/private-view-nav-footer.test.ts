import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PrivateViewNavFooter from './private-view-nav-footer.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { useServerStore } from '@/stores/server';

let pinia: ReturnType<typeof createTestingPinia>;
let global: GlobalMountOptions;

beforeEach(() => {
	pinia = createTestingPinia({ createSpy: vi.fn });
	setActivePinia(pinia);
	global = { plugins: [pinia] };
});

describe('private-view-nav-footer', () => {
	it('mounts component', () => {
		expect(PrivateViewNavFooter).toBeTruthy();

		const wrapper = mount(PrivateViewNavFooter, { global });

		expect(wrapper.html()).toMatchSnapshot();
	});

	it('renders nothing when license is null', () => {
		useServerStore().info.license = null;

		const wrapper = mount(PrivateViewNavFooter, { global });

		expect(wrapper.find('.wrapper').exists()).toBe(false);
	});

	it('renders nothing when display_powered_by is falsy', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: null } };

		const wrapper = mount(PrivateViewNavFooter, { global });

		expect(wrapper.find('.wrapper').exists()).toBe(false);
	});

	it('renders nothing when display_powered_by is HIDDEN', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'HIDDEN' } };

		const wrapper = mount(PrivateViewNavFooter, { global });

		expect(wrapper.find('.wrapper').exists()).toBe(false);
	});

	it('renders wrapper when display_powered_by is DIRECTUS', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'DIRECTUS' } };

		const wrapper = mount(PrivateViewNavFooter, { global });

		expect(wrapper.find('.wrapper').exists()).toBe(true);
	});

	it('renders wrapper when display_powered_by is OIG', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'OIG' } };

		const wrapper = mount(PrivateViewNavFooter, { global });

		expect(wrapper.find('.wrapper').exists()).toBe(true);
	});

	it('renders slot content inside wrapper', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'DIRECTUS' } };

		const wrapper = mount(PrivateViewNavFooter, {
			slots: { default: '<span class="badge">Badge</span>' },
			global,
		});

		expect(wrapper.find('.wrapper .badge').exists()).toBe(true);
		expect(wrapper.find('.wrapper .badge').text()).toBe('Badge');
	});
});
