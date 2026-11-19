// @vitest-environment jsdom
import { type Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import Interface from './input-rich-text-html.vue';

// jsdom, not happy-dom: the raw HTML node sanitizes with DOMPurify
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
			},
		},
	});

	await flushPromises();
	await nextTick();
	const editor = wrapper.findComponent(EditorContent).props('editor') as Editor;
	return { wrapper, editor };
}

const FORM = '<form action="/search" method="get"><input type="text" name="q"><button type="submit">Go</button></form>';

test('a <form> locks the editor without form elements', async () => {
	const { editor } = await mountWithValue(`<p>a</p>${FORM}`);

	expect(editor.isEditable).toBe(false);
});

test('an edit keeps the <form> with form elements', async () => {
	const { wrapper, editor } = await mountWithValue(`<p>a</p>${FORM}`, { keepFormElements: true });

	expect(editor.isEditable).toBe(true);

	editor.chain().setTextSelection(2).insertContent('b').run();

	expect(wrapper.emitted('input')?.at(-1)).toEqual([`<p>ab</p>${FORM}<p></p>`]);
});
