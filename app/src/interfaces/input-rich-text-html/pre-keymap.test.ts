import { Editor } from '@tiptap/vue-3';
import { describe, expect, test } from 'vitest';
import { editorExtensions } from './extensions';

function editorWith(content: string): Editor {
	return new Editor({ extensions: editorExtensions, content });
}

/** Dispatch a key through the editor's keymap exactly as the browser would, returning whether it was handled. */
function press(editor: Editor, key: string): boolean {
	const event = new KeyboardEvent('keydown', { key });
	return editor.view.someProp('handleKeyDown', (fn) => fn(editor.view, event)) ?? false;
}

describe('code block: triple-enter exit', () => {
	test('Enter at the end of a block ending in two blank lines exits the block', () => {
		const editor = editorWith('<pre><code>code\n\n</code></pre>');
		editor.commands.focus('end');

		expect(press(editor, 'Enter')).toBe(true);
		expect(editor.isActive('codeBlock')).toBe(false);
		// the two trailing blank lines are removed and a paragraph follows the block
		expect(editor.getHTML()).toContain('<pre><code>code</code></pre>');

		editor.destroy();
	});

	test('Enter elsewhere in the block adds a newline and stays in the block', () => {
		const editor = editorWith('<pre><code>code</code></pre>');
		editor.commands.focus('end');

		press(editor, 'Enter');
		expect(editor.isActive('codeBlock')).toBe(true);
		expect(editor.getHTML()).toContain('<pre><code>code\n</code></pre>');

		editor.destroy();
	});
});

describe('code block: backspace removes an empty block', () => {
	test('Backspace in an empty code block removes it', () => {
		const editor = editorWith('<pre><code></code></pre>');
		editor.commands.focus('start');

		expect(press(editor, 'Backspace')).toBe(true);
		expect(editor.isActive('codeBlock')).toBe(false);
		expect(editor.getHTML()).not.toContain('<pre>');

		editor.destroy();
	});
});

describe('inline code: toggle', () => {
	test('toggleCode applies and removes the code mark', () => {
		const editor = editorWith('<p>text</p>');
		editor.commands.selectAll();

		editor.commands.toggleCode();
		expect(editor.isActive('code')).toBe(true);
		expect(editor.getHTML()).toContain('<code>');

		editor.commands.toggleCode();
		expect(editor.isActive('code')).toBe(false);
		expect(editor.getHTML()).not.toContain('<code>');

		editor.destroy();
	});
});

describe('inline code: Enter does not carry the code mark into the new paragraph', () => {
	test('text typed after Enter at the end of inline code is plain text', () => {
		const editor = editorWith('<p><code>foo</code></p>');
		editor.commands.focus('end');

		expect(press(editor, 'Enter')).toBe(true);
		expect(editor.isActive('code')).toBe(false);

		editor.commands.insertContent('bar');
		expect(editor.getHTML()).toContain('<p>bar</p>');
		expect(editor.getHTML()).not.toContain('<code>bar');

		editor.destroy();
	});
});
