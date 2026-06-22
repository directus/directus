import { TextSelection } from '@tiptap/pm/state';
import { type Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import Interface from './input-rich-text-html.vue';

/**
 * Regression (CMS-2635): clicking into TinyMCE-authored content must not mark the field dirty.
 *
 * StarterKit's TrailingNode flags "insert a trailing paragraph" when loaded content ends in a
 * non-paragraph block, but only appends it on the first dispatched transaction. A click is a
 * selection-only transaction; if it triggers that deferred append, `onUpdate` fires and the
 * interface emits `input` — marking the field dirty without any user edit. Content authored in
 * Tiptap already ends in that trailing paragraph, so it never reproduced.
 */
async function mountWithValue(value: string) {
	const wrapper = mount(Interface, {
		props: { value },
		global: { plugins: [createPinia()], stubs: { Toolbar: true, ImageDrawer: true } },
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
