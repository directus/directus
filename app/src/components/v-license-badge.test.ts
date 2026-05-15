import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import VLicenseBadge from './v-license-badge.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { useServerStore } from '@/stores/server';

const i18n = createI18n({ legacy: false });

let pinia: ReturnType<typeof createTestingPinia>;
let global: GlobalMountOptions;

beforeEach(() => {
	pinia = createTestingPinia({ createSpy: vi.fn });
	setActivePinia(pinia);
	global = { plugins: [i18n, pinia] };
});

describe('v-license-badge', () => {
	it('mounts component', () => {
		expect(VLicenseBadge).toBeTruthy();

		const wrapper = mount(VLicenseBadge, { global });

		expect(wrapper.html()).toMatchSnapshot();
	});

	it('renders nothing when license is null', () => {
		useServerStore().info.license = null;

		const wrapper = mount(VLicenseBadge, { global });

		expect(wrapper.find('a').exists()).toBe(false);
	});

	it('renders nothing when display_powered_by is not DIRECTUS or OIG', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'OTHER' } };

		const wrapper = mount(VLicenseBadge, { global });

		expect(wrapper.find('a').exists()).toBe(false);
	});

	it('renders badge linking to directus.io when display_powered_by is DIRECTUS', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'DIRECTUS' } };

		const wrapper = mount(VLicenseBadge, { global });

		expect(wrapper.find('a').exists()).toBe(true);
		expect(wrapper.find('a').attributes('href')).toBe('https://directus.io/');
	});

	it('renders badge linking to directus.io/oig when display_powered_by is OIG', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'OIG' } };

		const wrapper = mount(VLicenseBadge, { global });

		expect(wrapper.find('a').exists()).toBe(true);
		expect(wrapper.find('a').attributes('href')).toBe('https://directus.io/oig');
	});

	it('adds private class to anchor when private prop is true', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'DIRECTUS' } };

		const wrapper = mount(VLicenseBadge, { props: { private: true }, global });

		expect(wrapper.find('a').classes()).toContain('private');
	});

	it('does not add private class to anchor when private prop is false', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'DIRECTUS' } };

		const wrapper = mount(VLicenseBadge, { props: { private: false }, global });

		expect(wrapper.find('a').classes()).not.toContain('private');
	});
});
