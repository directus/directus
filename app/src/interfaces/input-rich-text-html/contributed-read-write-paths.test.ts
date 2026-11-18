import { mergeAttributes, Node } from '@tiptap/core';
import { Editor } from '@tiptap/vue-3';
import { flushPromises, mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { nextTick, shallowRef } from 'vue';
import { createI18n } from 'vue-i18n';
import { computeValueNormalizationDiff } from './composables/normalization-diff';
import { useSourceCode } from './composables/use-source-code';
import { buildFieldSchema, fieldEditorExtensions, type FieldSchemaOptions } from './extensions';
import { toggleBlockFormat } from './extensions/block-formats';
import type { BlockCustomFormat } from './extensions/custom-formats';
import { decodePageBreaks, encodePageBreaks } from './extensions/page-break';
import Interface from './input-rich-text-html.vue';
import { useClipboardActions } from './toolbar/use-clipboard-actions';
import { registerRichTexts } from '@/rich-text/register';

// each describe is one path besides the live editor that reads or writes a field's HTML

// not `defining`, so a paste only keeps the wrapper when the clipboard says where the slice opens
const Callout = Node.create({
	name: 'callout',
	group: 'block',
	content: 'block+',
	parseHTML: () => [{ tag: 'div[data-callout]' }],
	renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-callout': '' }), 0],
});

const ID = 'test-callout';
const callout = '<div data-callout=""><p>hi</p></div>';

const editors: Editor[] = [];

// fixtures end in a paragraph so trailing-node does not append one on the first dispatch
function editorFor(content: string, options: FieldSchemaOptions = {}) {
	const schema = buildFieldSchema(options);
	const editor = new Editor({ extensions: fieldEditorExtensions(schema.extensions), content });
	editors.push(editor);
	return { editor, schema };
}

const hasCallout = (editor: Editor) => editor.getJSON().content!.some((node) => node.type === 'callout');

async function mountInterface(props: InstanceType<typeof Interface>['$props']) {
	const i18n = createI18n({ legacy: false, missingWarn: false, locale: 'en-US', messages: { 'en-US': {} } });

	const wrapper = mount(Interface, {
		props,
		attachTo: document.body,
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
	return wrapper;
}

beforeEach(() => registerRichTexts([{ id: ID, name: 'Callout', extensions: [Callout] }]));

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
	registerRichTexts([]);
	vi.restoreAllMocks();
});

describe('source code drawer', () => {
	function drawerFor(content: string, extensions: string[]) {
		const { editor, schema } = editorFor(content, { extensions });
		return { editor, ...useSourceCode(shallowRef(editor), schema.extensions) };
	}

	test('shows the contributed markup when it opens', () => {
		const { code, openSourceCodeDrawer } = drawerFor(callout, [ID]);

		openSourceCodeDrawer();

		expect(code.value).toContain('<div data-callout="">');
	});

	test('keeps hand-typed contributed markup as the node, without a normalization prompt', () => {
		const { editor, code, normalizeConfirmOpen, openSourceCodeDrawer, saveSourceCode } = drawerFor('<p></p>', [ID]);

		openSourceCodeDrawer();
		code.value = '<div data-callout><p>typed</p></div><p>after</p>';
		saveSourceCode();

		expect(normalizeConfirmOpen.value).toBe(false);
		expect(editor.getJSON().content![0]!.type).toBe('callout');
		expect(editor.getHTML()).toBe('<div data-callout=""><p>typed</p></div><p>after</p>');
	});

	// typed in render order, as any reordering prompts, for core nodes too
	test('keeps the attributes a user types on the contributed element', () => {
		const { editor, code, normalizeConfirmOpen, openSourceCodeDrawer, saveSourceCode } = drawerFor('<p></p>', [ID]);
		const typed = '<div class="warning" data-callout="" data-tone="warm"><p>typed</p></div><p>after</p>';

		openSourceCodeDrawer();
		code.value = typed;
		saveSourceCode();

		expect(normalizeConfirmOpen.value).toBe(false);
		expect(editor.getHTML()).toBe(typed);
	});

	// the class the node matches on is also one the class passthrough reads, so it must not double up
	test('keeps hand-typed markup for a node that matches on a class', () => {
		const ClassCallout = Node.create({
			name: 'classCallout',
			group: 'block',
			content: 'block+',
			parseHTML: () => [{ tag: 'div.callout' }],
			renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { class: 'callout' }), 0],
		});

		registerRichTexts([{ id: 'test-class-callout', name: 'Class callout', extensions: [ClassCallout] }]);

		const { editor, code, normalizeConfirmOpen, openSourceCodeDrawer, saveSourceCode } = drawerFor('<p></p>', [
			'test-class-callout',
		]);

		const typed = '<div class="callout"><p>typed</p></div><p>after</p>';

		openSourceCodeDrawer();
		code.value = typed;
		saveSourceCode();

		expect(normalizeConfirmOpen.value).toBe(false);
		expect(editor.getJSON().content![0]!.type).toBe('classCallout');
		expect(editor.getHTML()).toBe(typed);
	});

	test('asks before dropping the markup on a field that did not enable the extension', () => {
		const { code, normalizeConfirmOpen, openSourceCodeDrawer, saveSourceCode } = drawerFor('<p></p>', []);

		openSourceCodeDrawer();
		code.value = callout;
		saveSourceCode();

		expect(normalizeConfirmOpen.value).toBe(true);
	});
});

describe('copy and paste', () => {
	let write: ReturnType<typeof vi.fn>;
	let read: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		write = vi.fn().mockResolvedValue(undefined);
		read = vi.fn();

		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: { write, read, readText: vi.fn().mockResolvedValue('') },
		});
	});

	async function toolbarCopy(editor: Editor): Promise<string> {
		await useClipboardActions().copySelection(editor);
		const item = (write.mock.calls[0]![0] as ClipboardItem[])[0]!;
		return (await item.getType('text/html')).text();
	}

	function selectedCallout() {
		const { editor } = editorFor(`${callout}<p>after</p>`, { extensions: [ID] });
		editor.commands.selectAll();
		return editor;
	}

	const pasteTarget = () => editorFor('<p></p>', { extensions: [ID] }).editor;

	test('the copy button serializes the contributed node as its own markup', async () => {
		const html = await toolbarCopy(selectedCallout());

		expect(html).toContain('data-callout=""');
		expect(html).toContain('<p>hi</p></div>');
	});

	test('the paste button inserts copied markup back as the node', async () => {
		const html = await toolbarCopy(selectedCallout());
		read.mockResolvedValue([{ types: ['text/html'], getType: async () => new Blob([html], { type: 'text/html' }) }]);

		const editor = pasteTarget();
		await useClipboardActions().paste(editor);

		expect(hasCallout(editor)).toBe(true);
		expect(editor.getHTML()).not.toContain('data-pm-slice');
	});

	// Ctrl/Cmd+V skips the paste button and goes through ProseMirror's own clipboard parser
	test('Ctrl+V after the copy button pastes the node', async () => {
		const html = await toolbarCopy(selectedCallout());

		const editor = pasteTarget();
		editor.view.pasteHTML(html);

		expect(hasCallout(editor)).toBe(true);
	});

	// ProseMirror marks the copied slice with data-pm-slice; the data-* passthrough must not store it
	test('a native copy and paste stores the node without the clipboard marker', () => {
		const source = selectedCallout();
		const { dom } = source.view.serializeForClipboard(source.state.selection.content());

		const editor = pasteTarget();
		editor.view.pasteHTML(dom.innerHTML);

		expect(hasCallout(editor)).toBe(true);
		expect(editor.getHTML()).not.toContain('data-pm-slice');
	});
});

describe('read path', () => {
	// a read-only form (no update permission, archived item) renders the field through the interface
	test('the read-only interface renders the contributed node', async () => {
		const wrapper = await mountInterface({ value: callout, nonEditable: true, extensions: [ID] });

		expect(wrapper.find('.ProseMirror div[data-callout]').text()).toBe('hi');
		expect(wrapper.emitted('input')).toBeUndefined();
		wrapper.unmount();
	});
});

describe('page breaks and custom formats', () => {
	const LEAD = { title: 'Lead', selector: 'p', classes: 'lead' };
	const MARKER = { title: 'Marker', inline: 'span', classes: 'marker' };

	// the value boundary in input-rich-text-html.vue: decode before the editor, encode after it
	function roundTrip(value: string, options: FieldSchemaOptions) {
		const { editor } = editorFor(decodePageBreaks(value), options);
		return encodePageBreaks(editor.getHTML());
	}

	test('a page break next to a contributed node round-trips', () => {
		const value = `${callout}<!-- pagebreak --><p>next</p>`;
		expect(roundTrip(value, { extensions: [ID] })).toBe(value);
	});

	test('a page break inside a contributed node round-trips', () => {
		const value = '<div data-callout=""><p>a</p><!-- pagebreak --><p>b</p></div>';

		expect(roundTrip(value, { extensions: [ID] })).toBe(value);

		const { extensions, key } = buildFieldSchema({ extensions: [ID] });
		expect(computeValueNormalizationDiff(value, extensions, key)).toBeNull();
	});

	test('an inline custom format inside a contributed node round-trips', () => {
		const value = '<div data-callout=""><p>a <span class="marker">b</span></p></div>';
		const options = { extensions: [ID], customFormats: [MARKER] };

		expect(roundTrip(value, options)).toBe(value);

		const { extensions, key } = buildFieldSchema(options);
		expect(computeValueNormalizationDiff(value, extensions, key)).toBeNull();
	});

	test('a block custom format applies to a paragraph inside a contributed node', () => {
		const { editor, schema } = editorFor(`${callout}<p>after</p>`, { extensions: [ID], customFormats: [LEAD] });
		editor.commands.setTextSelection(3);

		toggleBlockFormat(editor, schema.formats[0] as BlockCustomFormat);

		expect(editor.getHTML()).toBe('<div data-callout=""><p class="lead">hi</p></div><p>after</p>');
	});
});

describe('comparison view', () => {
	test('renders a diff-marked contributed node in the editor, not the source fallback', async () => {
		const value = '<div data-callout=""><p>hi<span class="comparison-diff--added"> there</span></p></div>';
		const wrapper = await mountInterface({ value, comparisonMode: true, nonEditable: true, extensions: [ID] });

		expect(wrapper.findComponent({ name: 'InterfaceInputCode' }).exists()).toBe(false);
		expect(wrapper.find('.ProseMirror div[data-callout] .comparison-diff--added').text()).toBe('there');
		wrapper.unmount();
	});
});
