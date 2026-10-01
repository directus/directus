import { mergeAttributes, Node } from '@tiptap/core';
import { type Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import type { Change } from 'diff';
import { createPinia } from 'pinia';
import { afterEach, describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import NormalizationWarningDialog from './drawers/normalization-warning-dialog.vue';
import Interface from './input-rich-text-html.vue';
import InterfaceInputCode from '@/interfaces/input-code/input-code.vue';
import { registerRichTexts } from '@/rich-text/register';

// Content written while an extension was on, read after it was uninstalled or switched off for the
// field. There is no special path: it must go through the same guard as any unsupported markup.

const Callout = Node.create({
	name: 'callout',
	group: 'block',
	content: 'block+',
	parseHTML: () => [{ tag: 'div[data-callout]' }],
	renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0],
});

const ID = 'test-callout';
const config = { id: ID, name: 'Callout', extensions: [Callout] };

// ends in a paragraph so trailing-node does not append one on the first dispatch
const STORED = '<div data-callout=""><p>hi</p></div><p>end</p>';

async function mountWithValue(value: string, extensions: string[]) {
	const i18n = createI18n({ legacy: false, missingWarn: false, locale: 'en-US', messages: { 'en-US': {} } });

	const wrapper = mount(Interface, {
		props: { value, extensions },
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

	// Tiptap fires onCreate, which loads the value, on a timer
	await new Promise((resolve) => setTimeout(resolve));
	await flushPromises();
	await nextTick();
	const editor = wrapper.findComponent(EditorContent).props('editor') as Editor;
	return { wrapper, editor };
}

type Wrapper = Awaited<ReturnType<typeof mountWithValue>>['wrapper'];

const findDialog = (wrapper: Wrapper) => wrapper.findComponent(NormalizationWarningDialog);

async function openWarning(wrapper: Wrapper) {
	await wrapper.findComponent(EditorContent).trigger('click');
}

const removedLines = (diff: Change[]) =>
	diff
		.filter((change) => change.removed)
		.map((change) => change.value)
		.join('');

afterEach(() => registerRichTexts([]));

describe('markup of an extension the field no longer has', () => {
	test('stays editable while the extension is installed and enabled', async () => {
		registerRichTexts([config]);
		const { editor, wrapper } = await mountWithValue(STORED, [ID]);

		expect(editor.isEditable).toBe(true);
		expect(wrapper.emitted('readonly')?.at(-1)).toEqual([false]);
	});

	// the field option still lists the id; nothing registered claims it any more
	test('locks the editor once the extension is uninstalled', async () => {
		const { editor, wrapper } = await mountWithValue(STORED, [ID]);

		expect(editor.isEditable).toBe(false);
		expect(wrapper.emitted('readonly')?.at(-1)).toEqual([true]);
	});

	test('locks the editor when the extension is installed but disabled on this field', async () => {
		registerRichTexts([config]);
		const { editor, wrapper } = await mountWithValue(STORED, []);

		expect(editor.isEditable).toBe(false);
		expect(wrapper.emitted('readonly')?.at(-1)).toEqual([true]);
	});

	test('the warning shows the orphaned markup in its diff', async () => {
		registerRichTexts([config]);
		const { wrapper } = await mountWithValue(STORED, []);

		await openWarning(wrapper);

		expect(findDialog(wrapper).props('modelValue')).toBe(true);
		expect(removedLines(findDialog(wrapper).props('diff'))).toContain('data-callout');
	});

	test('raw editing gets the stored markup and saves edits verbatim', async () => {
		const { wrapper } = await mountWithValue(STORED, [ID]);

		await openWarning(wrapper);
		findDialog(wrapper).vm.$emit('raw');
		await nextTick();

		const code = wrapper.findComponent(InterfaceInputCode);
		expect(code.props('value')).toBe(STORED);

		const edited = STORED.replace('hi', 'edited');
		code.vm.$emit('input', edited);
		await nextTick();

		expect(wrapper.emitted('input')?.at(-1)).toEqual([edited]);
	});

	// "Edit anyway" is the clean-up: the first edit stores the content without the wrapper, as it
	// does for any other markup the schema cannot hold
	test('editing anyway strips the markup and keeps its content', async () => {
		const { editor, wrapper } = await mountWithValue(STORED, [ID]);

		await openWarning(wrapper);
		findDialog(wrapper).vm.$emit('confirm');
		await nextTick();

		expect(editor.isEditable).toBe(true);

		editor.chain().focus('end').insertContent('!').run();

		expect(wrapper.emitted('input')?.at(-1)).toEqual(['<p>hi</p><p>end!</p>']);
	});

	test('cancelling keeps the editor locked and the value untouched', async () => {
		const { editor, wrapper } = await mountWithValue(STORED, [ID]);

		await openWarning(wrapper);
		findDialog(wrapper).vm.$emit('cancel');
		await nextTick();

		expect(editor.isEditable).toBe(false);
		expect(wrapper.emitted('input')).toBeUndefined();
	});
});
