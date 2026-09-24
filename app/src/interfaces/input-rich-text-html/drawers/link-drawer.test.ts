import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import { createI18n } from 'vue-i18n';
import LinkDrawer from './link-drawer.vue';

function mountDrawer(imageLink: boolean) {
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	return mount(LinkDrawer, {
		props: {
			modelValue: true,
			linkSelection: { url: null, displayText: null, title: null, newTab: true },
			editing: false,
			saveable: false,
			imageLink,
		},
		global: {
			plugins: [i18n],
			directives: { tooltip: {} },
			stubs: {
				VDrawer: { template: '<div><slot /></div>' },
				// the auto stub chokes on VInput's `prefix` prop
				VInput: { template: '<input>' },
				VCheckbox: true,
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
});
