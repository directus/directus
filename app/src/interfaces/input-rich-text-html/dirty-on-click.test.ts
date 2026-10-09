import { TextSelection } from '@tiptap/pm/state';
import { type Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import Interface from './input-rich-text-html.vue';

/**
 * Regression: clicking into TinyMCE-authored content must not mark the field dirty. TrailingNode
 * defers its "append trailing paragraph" normalization to the first dispatched transaction; if a
 * selection-only click triggers it, the interface emits `input` without any user edit.
 */
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
			},
		},
	});

	await flushPromises();
	await nextTick();
	const editor = wrapper.findComponent(EditorContent).props('editor') as Editor;
	return { wrapper, editor };
}

/** Simulate a click: a selection-only transaction, no content edit. */
function click(editor: Editor) {
	const { tr } = editor.state;
	editor.view.dispatch(tr.setSelection(TextSelection.atStart(tr.doc)));
}

describe('dirty on click', () => {
	test('clicking content ending in a non-paragraph block emits no input', async () => {
		const { wrapper, editor } = await mountWithValue('<h2>heading</h2>');

		click(editor);
		await nextTick();

		expect(wrapper.emitted('input')).toBeUndefined();
	});

	test('clicking content ending in a paragraph emits no input', async () => {
		const { wrapper, editor } = await mountWithValue('<p>just text</p>');

		click(editor);
		await nextTick();

		expect(wrapper.emitted('input')).toBeUndefined();
	});
});
