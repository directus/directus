import { type Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import NormalizationWarningDialog from './drawers/normalization-warning-dialog.vue';
import Interface from './input-rich-text-html.vue';
import InterfaceInputCode from '@/interfaces/input-code/input-code.vue';

/**
 * Raw editing mode: the normalization warning offers editing the stored HTML as text in the code
 * interface, which never round-trips through the Tiptap schema — the loss-free alternative to
 * "Continue".
 */
const LOSSY = '<marquee>legacy</marquee>';

async function mountWithValue(value: string) {
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	const wrapper = mount(Interface, {
		props: { value },
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
	const editor = wrapper.findComponent(EditorContent).props('editor') as Editor;
	return { wrapper, editor };
}

async function enterRawMode(wrapper: Awaited<ReturnType<typeof mountWithValue>>['wrapper']) {
	await wrapper.findComponent(EditorContent).trigger('click');
	wrapper.findComponent(NormalizationWarningDialog).vm.$emit('raw');
	await nextTick();
}

// isVisible() is unreliable for v-show under jsdom; assert on the inline style it toggles
function editorContentHidden(wrapper: Awaited<ReturnType<typeof mountWithValue>>['wrapper']) {
	return (wrapper.findComponent(EditorContent).attributes('style') ?? '').includes('display: none');
}

describe('raw editing mode', () => {
	test('choosing raw editing from the warning swaps the visual editor for the code interface', async () => {
		const { wrapper } = await mountWithValue(LOSSY);

		await enterRawMode(wrapper);

		expect(wrapper.findComponent(InterfaceInputCode).exists()).toBe(true);
		expect(editorContentHidden(wrapper)).toBe(true);
		expect(wrapper.find('toolbar-stub').exists()).toBe(false);
	});

	test('raw edits emit the value verbatim, without schema normalization', async () => {
		const { wrapper } = await mountWithValue(LOSSY);

		await enterRawMode(wrapper);

		const edited = '<marquee>edited</marquee>';
		wrapper.findComponent(InterfaceInputCode).vm.$emit('input', edited);
		await nextTick();

		const emitted = wrapper.emitted('input');
		expect(emitted?.at(-1)).toEqual([edited]);
	});
});
