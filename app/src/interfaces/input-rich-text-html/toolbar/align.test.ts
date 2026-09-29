import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { toolbarButtons, type ToolbarContext } from './buttons';

// align commands don't touch the context; a bare stub satisfies the signature
const ctx = {} as ToolbarContext;

const editors: Editor[] = [];

// mount to a real element so the ProseMirror view has a document root, and track for teardown
// (an unmounted/leaked editor leaves DOM-observer timers that fire after the env is gone)
function makeEditor(content = '<p>hi</p>') {
	const editor = new Editor({
		element: document.createElement('div'),
		extensions: [StarterKit, TextAlign.configure({ types: ['heading', 'paragraph'] })],
		content,
	});

	editor.commands.selectAll();
	editors.push(editor);
	return editor;
}

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

describe.each([
	['alignleft', 'left'],
	['aligncenter', 'center'],
	['alignright', 'right'],
	['alignjustify', 'justify'],
] as const)('%s', (key, value) => {
	test(`applies text-align: ${value}`, () => {
		const editor = makeEditor();
		toolbarButtons[key]!.command(editor, ctx);
		expect(editor.getHTML()).toContain(`text-align: ${value}`);
	});

	test('reports active only for its own alignment', () => {
		const editor = makeEditor();
		toolbarButtons[key]!.command(editor, ctx);
		expect(toolbarButtons[key]!.isActive?.(editor, ctx)).toBe(true);

		const other = key === 'aligncenter' ? 'alignleft' : 'aligncenter';
		expect(toolbarButtons[other]!.isActive?.(editor, ctx)).toBe(false);
	});

	test('aligns headings too', () => {
		const editor = makeEditor('<h2>title</h2>');
		toolbarButtons[key]!.command(editor, ctx);
		expect(editor.getHTML()).toContain(`text-align: ${value}`);
	});
});

describe('alignnone', () => {
	test('removes an existing alignment', () => {
		const editor = makeEditor();
		toolbarButtons.aligncenter!.command(editor, ctx);
		expect(editor.getHTML()).toContain('text-align');

		toolbarButtons.alignnone!.command(editor, ctx);
		expect(editor.getHTML()).not.toContain('text-align');
	});
});
