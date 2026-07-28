import { createTestingPinia } from '@pinia/testing';
import { mount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import VNonProductionBadge from './v-non-production-badge.vue';
import type { GlobalMountOptions } from '@/__utils__/types';
import { useServerStore } from '@/stores/server';

const i18n = createI18n({ legacy: false });

let pinia: ReturnType<typeof createTestingPinia>;
let global: GlobalMountOptions;

beforeEach(() => {
	pinia = createTestingPinia({ createSpy: vi.fn });
	setActivePinia(pinia);
	global = { plugins: [i18n, pinia], stubs: ['v-icon'] };
});

describe('v-non-production-badge', () => {
	it('mounts component', () => {
		expect(VNonProductionBadge).toBeTruthy();

		const wrapper = mount(VNonProductionBadge, { global });

		expect(wrapper.html()).toMatchSnapshot();
	});

	it('renders nothing when license is null', () => {
		useServerStore().info.license = null;

		const wrapper = mount(VNonProductionBadge, { global });

		expect(wrapper.find('.v-chip').exists()).toBe(false);
	});

	it('renders nothing when display_powered_by is not NON_PROD', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'DIRECTUS' } };

		const wrapper = mount(VNonProductionBadge, { global });

		expect(wrapper.find('.v-chip').exists()).toBe(false);
	});

	it('renders chip when display_powered_by is NON_PROD', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'NON_PROD' } };

		const wrapper = mount(VNonProductionBadge, { global });

		expect(wrapper.find('.v-chip').exists()).toBe(true);
	});

	it('renders code icon inside chip', () => {
		useServerStore().info.license = { source: null, entitlements: { display_powered_by: 'NON_PROD' } };

		const wrapper = mount(VNonProductionBadge, { global });

		expect(wrapper.find('v-icon-stub').attributes('name')).toBe('code');
	});
});
