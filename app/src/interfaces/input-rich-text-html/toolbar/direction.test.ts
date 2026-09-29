import StarterKit from '@tiptap/starter-kit';
import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { Direction } from '../extensions/direction';
import { toolbarButtons, type ToolbarContext } from './buttons';

// direction commands don't touch the context; a bare stub satisfies the signature
const ctx = {} as ToolbarContext;

const editors: Editor[] = [];

// mount to a real element so the ProseMirror view has a document root, and track for teardown
// (an unmounted/leaked editor leaves DOM-observer timers that fire after the env is gone)
function makeEditor(content = '<p>hi</p>') {
	const editor = new Editor({
		element: document.createElement('div'),
		extensions: [StarterKit, Direction],
		content,
	});

	editor.commands.selectAll();
	editors.push(editor);
	return editor;
}

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

describe.each([['ltr'], ['rtl']] as const)('%s', (key) => {
	test(`sets dir="${key}"`, () => {
		const editor = makeEditor();
		toolbarButtons[key]!.command!(editor, ctx);
		expect(editor.getHTML()).toContain(`dir="${key}"`);
	});

	test('reports active only for its own direction', () => {
		const editor = makeEditor();
		toolbarButtons[key]!.command!(editor, ctx);
		expect(toolbarButtons[key]!.isActive?.(editor, ctx)).toBe(true);

		const other = key === 'ltr' ? 'rtl' : 'ltr';
		expect(toolbarButtons[other]!.isActive?.(editor, ctx)).toBe(false);
	});

	test('sets dir on headings, lists, and blockquote', () => {
		for (const content of ['<h2>title</h2>', '<ul><li><p>one</p></li></ul>', '<blockquote><p>quote</p></blockquote>']) {
			const editor = makeEditor(content);
			toolbarButtons[key]!.command!(editor, ctx);
			expect(editor.getHTML()).toContain(`dir="${key}"`);
		}
	});
});

describe('unsetDirection', () => {
	test('removes an existing dir attribute', () => {
		const editor = makeEditor();
		toolbarButtons.rtl!.command!(editor, ctx);
		expect(editor.getHTML()).toContain('dir=');

		editor.chain().focus().unsetDirection().run();
		expect(editor.getHTML()).not.toContain('dir=');
	});

	test('removeformat clears dir', () => {
		const editor = makeEditor();
		toolbarButtons.rtl!.command!(editor, ctx);
		expect(editor.getHTML()).toContain('dir=');

		toolbarButtons.removeformat!.command!(editor, ctx);
		expect(editor.getHTML()).not.toContain('dir=');
	});
});
