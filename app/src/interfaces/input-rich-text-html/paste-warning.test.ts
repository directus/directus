import { Slice } from '@tiptap/pm/model';
import { type Editor, EditorContent } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, test } from 'vitest';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
import { computeValueNormalizationDiff } from './composables/normalization-diff';
import PasteWarningDialog from './drawers/paste-warning-dialog.vue';
import Interface from './input-rich-text-html.vue';
import InterfaceInputCode from '@/interfaces/input-code/input-code.vue';

/**
 * Paste-time guard: markup the schema can't represent is caught before it lands, so the value never
 * reaches storage in a state the load-time warning would lock (see use-normalization-warning.ts).
 */
/** The shape Figma puts on the clipboard: `data-*` round-trips, `style` never does. */
const LOSSY = '<span style="white-space: pre-wrap;" data-metadata="figma">Grass</span>';
const SUPPORTED = '<p>fine</p>';

// Figma's clipboard shape; on load the line break becomes a hard break and the double space collapses
const FIGMA_CLIPBOARD =
	`<meta charset='utf-8'><span data-metadata="<!--(figmeta)e30=(/figmeta)-->"></span>` +
	`<span data-buffer="<!--(figma)e30=(/figma)-->"></span><span style="white-space:pre-wrap;">Grass\nis  green</span>`;

async function mountWithValue(value: string | null, extraProps: Record<string, unknown> = {}) {
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
				PasteWarningDialog: true,
				InterfaceInputCode: true,
			},
		},
	});

	await flushPromises();
	await nextTick();
	const editor = wrapper.findComponent(EditorContent).props('editor') as Editor;

	// Tiptap emits `create` on a timer, so the initial content lands an unpredictable number of
	// flushes after mount — wait for it rather than guessing a count.
	for (let i = 0; i < 10 && value && editor.isEmpty; i++) await flushPromises();
	return { wrapper, editor };
}

/** Drives the view's own paste hook: jsdom has no DataTransfer, so the clipboard is faked. */
function paste(editor: Editor, html: string) {
	const event = {
		clipboardData: { getData: (type: string) => (type === 'text/html' ? html : '') },
	} as unknown as ClipboardEvent;

	const handled = editor.view.someProp('handlePaste', (handler) => handler(editor.view, event, Slice.empty));

	return handled === true;
}

function dialog(wrapper: Awaited<ReturnType<typeof mountWithValue>>['wrapper']) {
	return wrapper.findComponent(PasteWarningDialog);
}

describe('paste warning', () => {
	test('a paste the schema can represent is left to the editor', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		expect(paste(editor, SUPPORTED)).toBe(false);
		await nextTick();

		expect(dialog(wrapper).props('modelValue')).toBe(false);
	});

	test('a paste without HTML on the clipboard is left to the editor', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		expect(paste(editor, '')).toBe(false);
		await nextTick();

		expect(dialog(wrapper).props('modelValue')).toBe(false);
	});

	// ProseMirror stamps the first element of copied HTML with `data-pm-slice`; an inline copy puts it
	// on a mark, where the wildcard data-* preservation would otherwise keep it in the document
	test('inline content copied from the editor pastes through without the slice marker', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');
		editor.commands.setTextSelection(6);
		const clipboard = '<strong data-pm-slice="1 1 []">bold</strong> text';

		expect(paste(editor, clipboard)).toBe(false);
		editor.view.pasteHTML(clipboard);
		await nextTick();

		expect(dialog(wrapper).props('modelValue')).toBe(false);
		expect(editor.getHTML()).toBe('<p>Hello<strong>bold</strong> text</p>');
	});

	test('a block copied from the editor is left to the editor', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		expect(paste(editor, '<p data-pm-slice="0 0 []">fine</p>')).toBe(false);
		await nextTick();

		expect(dialog(wrapper).props('modelValue')).toBe(false);
	});

	// Chrome prefixes clipboard HTML with a charset meta; Windows builds also wrap it in fragment
	// comments. Neither is content the editor could lose.
	test('browser clipboard framing is left to the editor', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		expect(paste(editor, "<meta charset='utf-8'><p>fine</p>")).toBe(false);
		expect(paste(editor, '<html><body><!--StartFragment--><p>fine</p><!--EndFragment--></body></html>')).toBe(false);
		await nextTick();

		expect(dialog(wrapper).props('modelValue')).toBe(false);
	});

	// loose inline HTML has no block wrapper, but the editor adding one is not a loss
	test('an inline fragment from a web page is left to the editor', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		expect(paste(editor, "<meta charset='utf-8'><strong>bold</strong> text")).toBe(false);
		await nextTick();

		expect(dialog(wrapper).props('modelValue')).toBe(false);
	});

	test('a lossy inline fragment still warns', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		expect(paste(editor, `<meta charset='utf-8'>${LOSSY}`)).toBe(true);
		await nextTick();

		expect(dialog(wrapper).props('modelValue')).toBe(true);
	});

	test('pasting anyway never stores the slice marker', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');
		editor.commands.setTextSelection(6);

		paste(editor, '<span style="white-space: pre-wrap;" data-pm-slice="1 1 []" data-metadata="figma">Grass</span>');
		await nextTick();
		dialog(wrapper).vm.$emit('confirm');
		await nextTick();

		expect(editor.getHTML()).toBe('<p>Hello<span data-metadata="figma">Grass</span></p>');
	});

	test('a lossy paste is blocked and opens the warning with the diff', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		expect(paste(editor, LOSSY)).toBe(true);
		await nextTick();

		expect(dialog(wrapper).props('modelValue')).toBe(true);
		expect(dialog(wrapper).props('diff')).not.toHaveLength(0);
		expect(editor.getHTML()).toBe('<p>Hello</p>');
	});

	test('pasting anyway inserts the cleaned content at the selection', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');
		editor.commands.setTextSelection(4);

		paste(editor, LOSSY);
		await nextTick();
		dialog(wrapper).vm.$emit('confirm');
		await nextTick();

		expect(editor.getHTML()).not.toContain('white-space');
		expect(editor.getText()).toContain('Grass');
		expect(dialog(wrapper).props('modelValue')).toBe(false);
	});

	test('pasting cleaned stores a value the next load leaves unchanged', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');
		editor.commands.setTextSelection(6);

		paste(editor, FIGMA_CLIPBOARD);
		await nextTick();
		dialog(wrapper).vm.$emit('confirm');
		await nextTick();

		const stored = wrapper.emitted('input')?.at(-1)?.[0] as string;
		expect(stored).toBe('<p>HelloGrass<br>is green</p>');
		expect(computeValueNormalizationDiff(stored)).toBeNull();
	});

	test('editing raw swaps in the code interface with the clipboard HTML at the cursor', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');
		editor.commands.setTextSelection(4);

		paste(editor, LOSSY);
		await nextTick();
		dialog(wrapper).vm.$emit('raw');
		await nextTick();

		expect(wrapper.emitted('input')?.at(-1)).toEqual([`<p>Hel</p><p>${LOSSY}</p><p>lo</p>`]);
		expect(wrapper.findComponent(InterfaceInputCode).exists()).toBe(true);
	});

	test('editing raw on an empty editor keeps the clipboard HTML alone', async () => {
		const { wrapper, editor } = await mountWithValue(null);

		paste(editor, LOSSY);
		await nextTick();
		dialog(wrapper).vm.$emit('raw');
		await nextTick();

		expect(wrapper.emitted('input')?.at(-1)).toEqual([`<p>${LOSSY}</p>`]);
	});

	test('dismissing the warning drops the paste and leaves the document untouched', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		paste(editor, LOSSY);
		await nextTick();
		dialog(wrapper).vm.$emit('cancel');
		await nextTick();

		expect(editor.getHTML()).toBe('<p>Hello</p>');
		expect(dialog(wrapper).props('modelValue')).toBe(false);
		expect(wrapper.emitted('input')).toBeUndefined();
	});
});
