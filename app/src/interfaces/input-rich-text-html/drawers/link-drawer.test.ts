import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import LinkDrawer from './link-drawer.vue';

function mountDrawer(targetsImage: boolean, urlDisallowed = false) {
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	return mount(LinkDrawer, {
		props: {
			modelValue: true,
			linkSelection: { url: null, displayText: null, title: null, newTab: true },
			editing: false,
			saveable: false,
			targetsImage,
			urlDisallowed,
		},
		global: {
			plugins: [i18n],
			directives: { tooltip: {} },
			stubs: {
				VDrawer: { template: '<div><slot /></div>' },
				// the auto stub chokes on VInput's `prefix` prop
				VInput: { template: '<input>' },
				VCheckbox: true,
				VNotice: { template: '<div class="v-notice"><slot /></div>' },
				PrivateViewHeaderBarActionButton: true,
			},
		},
	});
}

describe('link drawer', () => {
	test('hides the display text field for an image link', () => {
		const labels = mountDrawer(true)
			.findAll('.type-label')
			.map((label) => label.text());

		expect(labels).not.toContain('display_text');
		expect(labels).toContain('url');
	});

	test('shows the display text field for a text link', () => {
		const labels = mountDrawer(false)
			.findAll('.type-label')
			.map((label) => label.text());

		expect(labels).toContain('display_text');
	});

	test('shows an error for a url with a scheme that is not allowed', () => {
		const notice = mountDrawer(false, true).find('.v-notice');

		expect(notice.exists()).toBe(true);
		expect(notice.text()).toBe('interfaces.input-rich-text-html.link_protocol_not_allowed');
	});

	test('shows no error for an allowed url', () => {
		expect(mountDrawer(false).find('.v-notice').exists()).toBe(false);
	});
});
