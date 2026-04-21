import { createTestingPinia } from '@pinia/testing';
import { shallowMount } from '@vue/test-utils';
import { setActivePinia } from 'pinia';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import PublicView from './public-view.vue';
import { useServerStore } from '@/stores/server';

const i18n = createI18n({
	legacy: false,
	messages: {
		en: {
			application: 'Application',
		},
	},
});

describe('public-view branding', () => {
	beforeEach(() => {
		setActivePinia(
			createTestingPinia({
				createSpy: vi.fn,
				stubActions: false,
				initialState: {
					serverStore: {
						info: {
							project: {
								project_name: 'Directus',
								project_descriptor: null,
								project_logo: null,
								project_color: '#6644FF',
								public_foreground: null,
								public_background: null,
								public_note: null,
							},
							branding_label_key: 'brand_oig_label',
						},
					},
				},
			}),
		);
	});

	test('renders the branding badge when enabled', () => {
		const wrapper = shallowMount(PublicView, {
			global: {
				plugins: [i18n],
				directives: {
					md: {},
				},
			},
		});

		const badge = wrapper.findComponent({ name: 'PoweredByDirectus' });

		expect(badge.exists()).toBe(true);
		expect(badge.props('labelKey')).toBe('brand_oig_label');
	});

	test('hides the branding badge when disabled', () => {
		const serverStore = useServerStore();

		serverStore.info.branding_label_key = null;

		const wrapper = shallowMount(PublicView, {
			global: {
				plugins: [i18n],
				directives: {
					md: {},
				},
			},
		});

		expect(wrapper.findComponent({ name: 'PoweredByDirectus' }).exists()).toBe(false);
	});
});
