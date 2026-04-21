import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import PoweredByDirectus from './powered-by-directus.vue';

const i18n = createI18n({
	legacy: false,
	messages: {
		en: {
			brand_directus_label: 'Powered by Directus',
			brand_oig_label: 'Open Innovation Grant',
		},
	},
});

describe('powered-by-directus', () => {
	test('shows the Directus label by default', () => {
		const wrapper = mount(PoweredByDirectus, {
			props: {
				labelKey: 'brand_directus_label',
				type: 'accent',
			},
			global: {
				plugins: [i18n],
				stubs: {
					VIcon: true,
				},
			},
		});

		expect(wrapper.text()).toContain('Powered by Directus');
		expect(wrapper.classes()).toContain('type-accent');
	});

	test('shows the Open Innovation Grant label when requested', () => {
		const wrapper = mount(PoweredByDirectus, {
			props: {
				labelKey: 'brand_oig_label',
				type: 'normal',
			},
			global: {
				plugins: [i18n],
				stubs: {
					VIcon: true,
				},
			},
		});

		expect(wrapper.text()).toContain('Open Innovation Grant');
		expect(wrapper.classes()).toContain('type-normal');
	});
});
