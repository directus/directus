import { type Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import Interface from './input-rich-text-html.vue';

/**
 * The `disabled` prop flips without user interaction (form loading, collab field locks).
 * Tiptap's `setEditable` emits `update` by default, which would surface as a phantom `input`
 * emit, broadcasting stale content and stealing the collab field lock.
 */
const VALUE = '<p>hello world</p>';

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

describe('editable toggle', () => {
	test('toggling disabled keeps the editor editable state in sync', async () => {
		const { wrapper, editor } = await mountWithValue(VALUE);

		expect(editor.isEditable).toBe(true);

		await wrapper.setProps({ disabled: true });
		await nextTick();
		expect(editor.isEditable).toBe(false);

		await wrapper.setProps({ disabled: false });
		await nextTick();
		expect(editor.isEditable).toBe(true);
	});

	test('toggling disabled emits no input (content did not change)', async () => {
		const { wrapper } = await mountWithValue(VALUE);

		await wrapper.setProps({ disabled: true });
		await nextTick();
		await wrapper.setProps({ disabled: false });
		await nextTick();

		expect(wrapper.emitted('input')).toBeUndefined();
	});
});
