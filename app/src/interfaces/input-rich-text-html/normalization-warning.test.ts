import { type Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import { NORMALIZATION_WARNING_DISMISSED } from './composables/use-normalization-warning';
import Interface from './input-rich-text-html.vue';

/**
 * Integration wiring for the first-focus normalization warning: focusing the editor over a stored
 * value the schema can't represent must open the dialog (see use-normalization-warning.test.ts for
 * the trigger logic itself).
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
				NormalizationWarningDialog: true,
			},
		},
	});

	await flushPromises();
	await nextTick();
	const editor = wrapper.findComponent(EditorContent).props('editor') as Editor;
	return { wrapper, editor };
}

function focus(editor: Editor) {
	editor.emit('focus', { editor, event: new FocusEvent('focus'), transaction: editor.state.tr });
}

function findDialog(wrapper: Awaited<ReturnType<typeof mountWithValue>>['wrapper']) {
	return wrapper.find('normalization-warning-dialog-stub');
}

afterEach(() => {
	localStorage.removeItem(NORMALIZATION_WARNING_DISMISSED);
});

describe('normalization warning wiring', () => {
	test('focusing the editor over a lossy stored value opens the warning dialog', async () => {
		const { wrapper, editor } = await mountWithValue('<marquee>legacy</marquee>');

		focus(editor);
		await nextTick();

		expect(findDialog(wrapper).attributes('modelvalue')).toBe('true');
	});

	test('focusing the editor over a clean stored value opens nothing', async () => {
		const { wrapper, editor } = await mountWithValue('<p>hello <strong>world</strong></p>');

		focus(editor);
		await nextTick();

		expect(findDialog(wrapper).attributes('modelvalue')).toBe('false');
	});
});
