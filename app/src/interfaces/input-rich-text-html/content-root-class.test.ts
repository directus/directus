import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import Interface from './input-rich-text-html.vue';

/**
 * Richtext extensions style their nodes with their own CSS, scoped under `.richtext-content`.
 * That class is public API: renaming it or moving it off the content root breaks every
 * extension stylesheet, in the editor and in the comparison view.
 */
async function mountInterface(props: Record<string, unknown>) {
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	const wrapper = mount(Interface, {
		props: { value: '<p>hello</p>', ...props },
		attachTo: document.body,
		global: {
			plugins: [createPinia(), i18n],
			stubs: {
				Toolbar: true,
				TableBubbleMenu: true,
				ImageDrawer: true,
				LinkDrawer: true,
				MediaDrawer: true,
				SourceCodeDrawer: true,
				NormalizationWarningDialog: true,
				InterfaceInputCode: true,
			},
		},
	});

	await flushPromises();
	await nextTick();
	return wrapper;
}

describe('public content root class', () => {
	test.each([
		['editing', {}],
		['comparison view', { comparisonMode: true, nonEditable: true }],
		['read-only', { nonEditable: true }],
	])('the ProseMirror root carries .richtext-content (%s)', async (_label, props) => {
		const wrapper = await mountInterface(props);

		const root = wrapper.find('.ProseMirror');
		expect(root.exists()).toBe(true);
		expect(root.classes()).toContain('richtext-content');

		wrapper.unmount();
	});

	test('a scoped extension rule outranks the core content styles', async () => {
		const wrapper = await mountInterface({});
		const root = wrapper.find('.ProseMirror').element;

		const probe = document.createElement('div');
		probe.setAttribute('data-rt-probe', '');
		const paragraph = probe.appendChild(document.createElement('p'));
		const link = paragraph.appendChild(document.createElement('a'));
		root.appendChild(probe);

		const plain = root.querySelector(':scope > p')!;
		expect(getComputedStyle(plain).marginTop).toBe('21px');

		const extensionStyle = document.createElement('style');

		extensionStyle.textContent = `
			.richtext-content [data-rt-probe] p { margin-top: 3px; }
			.richtext-content [data-rt-probe] a { color: rgb(255, 0, 255); }
		`;

		document.head.prepend(extensionStyle);

		expect(getComputedStyle(paragraph).marginTop).toBe('3px');
		expect(getComputedStyle(link).color).toBe('rgb(255, 0, 255)');

		extensionStyle.remove();
		wrapper.unmount();
	});
});
