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

async function mountWithValue(value: string, extraProps: Record<string, unknown> = {}) {
	const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': {} } });

	const wrapper = mount(Interface, {
		props: { value, ...extraProps },
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

	// On a versioned item, opening raw editing is an edit intent: it must move the item to a Draft
	// version (parity with "Edit anyway"). The Draft switch is edit-driven, so force the current
	// value into the form via set-field-value without changing it (CMS-2881).
	test('entering raw mode force-sets the current value to trigger the draft switch when auto-switch is enabled', async () => {
		const { wrapper } = await mountWithValue(LOSSY, { field: 'body', autoSwitchToDraft: true });

		await enterRawMode(wrapper);

		expect(wrapper.emitted('setFieldValue')?.at(-1)).toEqual([{ field: 'body', value: LOSSY }]);
	});

	// Non-versioned items have no Draft to switch to; opening raw must not dirty the field.
	test('entering raw mode does not force a value when auto-switch is disabled', async () => {
		const { wrapper } = await mountWithValue(LOSSY, { field: 'body' });

		await enterRawMode(wrapper);

		expect(wrapper.emitted('setFieldValue')).toBeUndefined();
	});
});
