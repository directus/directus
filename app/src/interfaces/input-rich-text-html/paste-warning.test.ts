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
 * Paste-time guard: markup the schema can't represent is cleaned as it lands and flagged inline, so
 * the value never reaches storage in a state the load-time warning would lock (see
 * use-normalization-warning.ts) and the loss is not silent.
 */
/** The shape Figma puts on the clipboard: `data-*` round-trips, `style` never does. */
const LOSSY = '<span style="white-space: pre-wrap;" data-metadata="figma">Grass</span>';
const SUPPORTED = '<p>fine</p>';

// Google Docs' clipboard shape: one `<b>` wrapper, and its document defaults stamped on every element
const DOCS_SPAN =
	'font-size:11pt;font-family:Arial,sans-serif;color:#000000;background-color:transparent;font-weight:400;' +
	'font-style:normal;font-variant:normal;text-decoration:none;vertical-align:baseline;white-space:pre;white-space:pre-wrap;';

const DOCS_P = 'line-height:1.38;margin-top:0pt;margin-bottom:0pt;';

function googleDocs(paragraphs: string) {
	return `<meta charset='utf-8'><b style="font-weight:normal;" id="docs-internal-guid-4a1f">${paragraphs}</b>`;
}

const GOOGLE_DOCS_CLIPBOARD = googleDocs(
	`<p dir="ltr" style="${DOCS_P}"><span style="${DOCS_SPAN}">Awiwiwwi</span></p><br />` +
		`<p dir="ltr" style="${DOCS_P}"><span style="${DOCS_SPAN}">Thus is a test</span></p>`,
);

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

type Wrapper = Awaited<ReturnType<typeof mountWithValue>>['wrapper'];

function dialog(wrapper: Wrapper) {
	return wrapper.findComponent(PasteWarningDialog);
}

function notice(wrapper: Wrapper) {
	return wrapper.find('.paste-notice');
}

/** A lossy paste followed by the notice link, which is how the dialog is reached. */
async function pasteAndOpen(wrapper: Wrapper, editor: Editor, html: string) {
	paste(editor, html);
	await nextTick();
	await notice(wrapper).find('a').trigger('click');
	await nextTick();
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

	// the schema rewrites all of these (tag aliases, attribute order, implied wrappers) without
	// dropping anything; a textual comparison would open the dialog on every one
	test.each([
		['bold from a web page', '<p>Hello <b>bold</b></p>'],
		['a plain table', '<table><tr><td>a</td></tr></table>'],
		['a blockquote', '<blockquote>quoted</blockquote>'],
		['a nested list', '<ul><li>a<ul><li>b</li></ul></li></ul>'],
		['a link with reordered attributes', '<p><a href="https://x.test" target="_blank">x</a></p>'],
		['an image inside a paragraph', '<p><img src="https://x.test/a.png"></p>'],
		['a Word span with a supported style', '<p><span style="font-size:11pt">w</span></p>'],
		['a Google Docs paste', GOOGLE_DOCS_CLIPBOARD],
		[
			'a Google Docs link',
			googleDocs(
				`<p dir="ltr" style="${DOCS_P}"><a href="https://x.test" style="text-decoration:none;"><span style="${DOCS_SPAN.replace(
					'text-decoration:none',
					'text-decoration:underline;-webkit-text-decoration-skip:none;text-decoration-skip-ink:none',
				)}">link</span></a></p>`,
			),
		],
		[
			'a Google Docs image',
			googleDocs(
				`<p dir="ltr" style="${DOCS_P}"><span style="${DOCS_SPAN}">` +
					`<span style="border:none;display:inline-block;overflow:hidden;width:624px;height:416px;">` +
					`<img src="https://x.test/a.png" width="624" height="416" style="margin-left:0px;margin-top:0px;" /></span></span></p>`,
			),
		],
		[
			'a Google Docs table',
			googleDocs(
				`<div dir="ltr" style="margin-left:0pt;" align="left">` +
					`<table style="border:none;border-collapse:collapse;table-layout:fixed;width:468pt"><colgroup><col width="*" /></colgroup>` +
					`<tbody><tr style="height:0pt"><td style="border-left:solid #000000 1pt;border-right:solid #000000 1pt;` +
					`border-bottom:solid #000000 1pt;border-top:solid #000000 1pt;vertical-align:top;padding:5pt 5pt 5pt 5pt;overflow:hidden;overflow-wrap:break-word;">` +
					`<p dir="ltr" style="line-height:1.2;margin-top:0pt;margin-bottom:0pt;"><span style="${DOCS_SPAN}">cell</span></p></td></tr></tbody></table></div>`,
			),
		],
		[
			'a Google Docs list',
			googleDocs(
				`<ul style="margin-top:0;margin-bottom:0;padding-inline-start:48px;">` +
					`<li dir="ltr" style="list-style-type:disc;${DOCS_SPAN.replace('#000000', '#ff9900')}" aria-level="1">` +
					`<p dir="ltr" style="${DOCS_P}text-align: right;" role="presentation">` +
					`<span style="${DOCS_SPAN.replace('#000000', '#ff9900')}">Awiwiwiiw</span></p></li></ul>`,
			),
		],
		[
			'a Google Docs paste with underline and subscript',
			googleDocs(
				`<p dir="ltr" style="${DOCS_P}"><span style="${DOCS_SPAN.replace('text-decoration:none', 'text-decoration:underline')}">u</span>` +
					`<span style="${DOCS_SPAN.replace('vertical-align:baseline', 'vertical-align:sub')}">s</span></p>`,
			),
		],
	])('%s is left to the editor', async (_name, html) => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		expect(paste(editor, html)).toBe(false);
		await nextTick();

		expect(dialog(wrapper).props('modelValue')).toBe(false);
	});

	// only Docs' stamped defaults are noise; formatting the author chose is still checked
	test('a Google Docs paste with an indented paragraph still warns', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		expect(
			paste(
				editor,
				googleDocs(`<p dir="ltr" style="${DOCS_P}text-indent:36pt;"><span style="${DOCS_SPAN}">fine</span></p>`),
			),
		).toBe(true);

		await nextTick();

		expect(notice(wrapper).exists()).toBe(true);
	});

	test('a lossy inline fragment still warns', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		expect(paste(editor, `<meta charset='utf-8'>${LOSSY}`)).toBe(true);
		await nextTick();

		expect(notice(wrapper).exists()).toBe(true);
	});

	test('a lossy paste lands cleaned right away and shows the notice', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');
		editor.commands.setTextSelection(4);

		expect(paste(editor, LOSSY)).toBe(true);
		await nextTick();

		expect(editor.getHTML()).not.toContain('white-space');
		expect(editor.getText()).toContain('Grass');
		expect(notice(wrapper).exists()).toBe(true);
		expect(dialog(wrapper).props('modelValue')).toBe(false);
	});

	test('the cleaned paste never stores the slice marker', async () => {
		const { editor } = await mountWithValue('<p>Hello</p>');
		editor.commands.setTextSelection(6);

		paste(editor, '<span style="white-space: pre-wrap;" data-pm-slice="1 1 []" data-metadata="figma">Grass</span>');
		await nextTick();

		expect(editor.getHTML()).toBe('<p>Hello<span data-metadata="figma">Grass</span></p>');
	});

	test('the cleaned paste stores a value the next load leaves unchanged', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');
		editor.commands.setTextSelection(6);

		paste(editor, FIGMA_CLIPBOARD);
		await nextTick();

		const stored = wrapper.emitted('input')?.at(-1)?.[0] as string;
		expect(stored).toBe('<p>HelloGrass<br>is green</p>');
		expect(computeValueNormalizationDiff(stored)).toBeNull();
	});

	test('the notice link opens the dialog with the diff and the undo options', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		await pasteAndOpen(wrapper, editor, LOSSY);

		expect(dialog(wrapper).props('modelValue')).toBe(true);
		expect(dialog(wrapper).props('diff')).not.toHaveLength(0);
		expect(dialog(wrapper).props('undoable')).toBe(true);
	});

	test('keeping the paste closes the dialog and the notice', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		await pasteAndOpen(wrapper, editor, LOSSY);
		dialog(wrapper).vm.$emit('keep');
		await nextTick();

		expect(dialog(wrapper).props('modelValue')).toBe(false);
		expect(notice(wrapper).exists()).toBe(false);
		expect(editor.getText()).toContain('Grass');
	});

	// the overlay click and Esc close through v-model, not through a button
	test('closing the dialog from outside keeps the paste', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		await pasteAndOpen(wrapper, editor, LOSSY);
		dialog(wrapper).vm.$emit('update:modelValue', false);
		await nextTick();

		expect(notice(wrapper).exists()).toBe(false);
		expect(editor.getText()).toContain('Grass');
	});

	test('undoing the paste restores the document', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');
		editor.commands.setTextSelection(4);

		await pasteAndOpen(wrapper, editor, LOSSY);
		dialog(wrapper).vm.$emit('undo');
		await nextTick();

		expect(editor.getHTML()).toBe('<p>Hello</p>');
		expect(wrapper.emitted('input')?.at(-1)).toEqual(['<p>Hello</p>']);
		expect(notice(wrapper).exists()).toBe(false);
		expect(dialog(wrapper).props('modelValue')).toBe(false);
	});

	// typing right before the paste must not ride along with it when it is undone
	test('undoing the paste leaves what was typed before it', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');
		editor.chain().setTextSelection(6).insertContent(' there').run();

		await pasteAndOpen(wrapper, editor, LOSSY);
		dialog(wrapper).vm.$emit('undo');
		await nextTick();

		expect(editor.getHTML()).toBe('<p>Hello there</p>');
	});

	test('editing raw swaps in the code interface with the clipboard HTML at the cursor', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');
		editor.commands.setTextSelection(4);

		await pasteAndOpen(wrapper, editor, LOSSY);
		dialog(wrapper).vm.$emit('raw');
		await nextTick();

		expect(wrapper.emitted('input')?.at(-1)).toEqual([`<p>Hel</p><p>${LOSSY}</p><p>lo</p>`]);
		expect(wrapper.findComponent(InterfaceInputCode).exists()).toBe(true);
		expect(notice(wrapper).exists()).toBe(false);
	});

	// the split at a block edge would otherwise leave an empty `<p></p>` beside the paste
	test('editing raw at the end of a block does not leave an empty block behind', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p><p>World</p>');
		editor.commands.setTextSelection(6);

		await pasteAndOpen(wrapper, editor, LOSSY);
		dialog(wrapper).vm.$emit('raw');
		await nextTick();

		expect(wrapper.emitted('input')?.at(-1)).toEqual([`<p>Hello</p><p>${LOSSY}</p><p>World</p>`]);
	});

	test('editing raw inside an empty block replaces that block', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p><p></p><p>World</p>');
		editor.commands.setTextSelection(8);

		await pasteAndOpen(wrapper, editor, LOSSY);
		dialog(wrapper).vm.$emit('raw');
		await nextTick();

		expect(wrapper.emitted('input')?.at(-1)).toEqual([`<p>Hello</p><p>${LOSSY}</p><p>World</p>`]);
	});

	test('editing raw on an empty editor keeps the clipboard HTML alone', async () => {
		const { wrapper, editor } = await mountWithValue(null);

		await pasteAndOpen(wrapper, editor, LOSSY);
		dialog(wrapper).vm.$emit('raw');
		await nextTick();

		expect(wrapper.emitted('input')?.at(-1)).toEqual([`<p>${LOSSY}</p>`]);
	});

	// once the document moved on, an undo would take out the wrong thing
	test('an edit after the paste takes undo and raw off the dialog', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');
		editor.commands.setTextSelection(6);

		paste(editor, LOSSY);
		await nextTick();
		// away from the paste, so history opens a new event instead of extending the paste's
		editor.chain().setTextSelection(1).insertContent('x').run();
		await notice(wrapper).find('a').trigger('click');
		await nextTick();

		expect(dialog(wrapper).props('undoable')).toBe(false);

		dialog(wrapper).vm.$emit('undo');
		await nextTick();

		expect(editor.getHTML()).toBe('<p>xHello<span data-metadata="figma">Grass</span></p>');
		expect(notice(wrapper).exists()).toBe(false);
	});

	test('undoing the paste from the editor dismisses the notice', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		paste(editor, LOSSY);
		await nextTick();
		editor.commands.undo();
		await nextTick();

		expect(editor.getHTML()).toBe('<p>Hello</p>');
		expect(notice(wrapper).exists()).toBe(false);
	});

	test('an external value change dismisses the notice', async () => {
		const { wrapper, editor } = await mountWithValue('<p>Hello</p>');

		paste(editor, LOSSY);
		await nextTick();
		await wrapper.setProps({ value: '<p>Other</p>' });
		await flushPromises();
		await nextTick();

		expect(editor.getHTML()).toBe('<p>Other</p>');
		expect(notice(wrapper).exists()).toBe(false);
	});
});
