import { createTestingPinia } from '@pinia/testing';
import { shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PrivateViewNav from './private-view-nav.vue';
import { useServerStore } from '@/stores/server';

describe('private-view-nav branding', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				createSpy: vi.fn,
				stubActions: false,
				initialState: {
					serverStore: {
						info: {
							branding_label_key: 'brand_directus_label',
						},
					},
				},
			}),
		);
	});

	test('renders the branding badge when enabled', () => {
		const wrapper = shallowMount(PrivateViewNav);

		const badge = wrapper.findComponent({ name: 'PoweredByDirectus' });

		expect(badge.exists()).toBe(true);
		expect(badge.props('labelKey')).toBe('brand_directus_label');
	});

	test('hides the branding badge when disabled', () => {
		const serverStore = useServerStore();

		serverStore.info.branding_label_key = null;

		const wrapper = shallowMount(PrivateViewNav);

		expect(wrapper.findComponent({ name: 'PoweredByDirectus' }).exists()).toBe(false);
	});
});
