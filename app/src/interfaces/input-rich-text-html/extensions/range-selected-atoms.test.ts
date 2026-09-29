import { TextSelection } from '@tiptap/pm/state';
import { Editor } from '@tiptap/vue-3';
import { afterEach, expect, test } from 'vitest';
import { RANGE_SELECTED_CLASS } from './range-selected-atoms';
import { editorExtensions } from './index';

/**
 * ProseMirror only sets `ProseMirror-selectednode` for a NodeSelection, so a leaf like `<img>` looks
 * untouched under a range selection that covers it (select-all, shift+arrow) even though deleting
 * would remove it. Media node views don't have the problem: tiptap's `isNodeViewSelected` marks them
 * selected whenever the selection covers them. These tests pin the leaves to that same rule.
 */

const editors: Editor[] = [];

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

function setup(content: string) {
	const element = document.createElement('div');
	document.body.appendChild(element);

	const editor = new Editor({ element, extensions: editorExtensions, content });
	editors.push(editor);

	return editor;
}

function isMarked(editor: Editor, selector: string) {
	return editor.view.dom.querySelector(selector)?.classList.contains(RANGE_SELECTED_CLASS) ?? false;
}

const WITH_IMAGE = '<p>hello</p><img src="/assets/abc.jpg" alt="My alt"><p>world</p>';

test('marks an image covered by a select-all', () => {
	const editor = setup(WITH_IMAGE);

	editor.commands.selectAll();

	expect(isMarked(editor, 'img')).toBe(true);
});

test('marks an image covered by a text selection running across it', () => {
	const editor = setup(WITH_IMAGE);

	// caret inside "hello" to inside "world", i.e. shift+arrow or a drag past the image
	const to = editor.state.doc.content.size - 3;
	editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 3, to)));

	expect(isMarked(editor, 'img')).toBe(true);
});

test('leaves an image outside the selection unmarked', () => {
	const editor = setup(WITH_IMAGE);

	// entirely within the first paragraph, stopping before the image
	editor.view.dispatch(editor.state.tr.setSelection(TextSelection.create(editor.state.doc, 1, 6)));

	expect(isMarked(editor, 'img')).toBe(false);
});

test('leaves an image unmarked for a collapsed caret', () => {
	const editor = setup(WITH_IMAGE);

	editor.commands.setTextSelection(3);

	expect(isMarked(editor, 'img')).toBe(false);
});

test('marks an image inside a figure the selection covers', () => {
	const editor = setup('<figure><img src="/assets/abc.jpg" alt="My alt"><figcaption>A caption</figcaption></figure>');

	editor.commands.selectAll();

	expect(isMarked(editor, 'img')).toBe(true);
});

test('marks a horizontal rule covered by a select-all', () => {
	const editor = setup('<p>hello</p><hr><p>world</p>');

	editor.commands.selectAll();

	expect(isMarked(editor, 'hr')).toBe(true);
});

test('marks a page break covered by a select-all', () => {
	const editor = setup('<p>hello</p><div data-page-break="true"></div><p>world</p>');

	editor.commands.selectAll();

	expect(isMarked(editor, '.page-break')).toBe(true);
});

test('keeps the NodeSelection outline working alongside the range class', () => {
	const editor = setup(WITH_IMAGE);

	editor.commands.setNodeSelection(7);

	const img = editor.view.dom.querySelector('img')!;

	expect(img.classList.contains('ProseMirror-selectednode')).toBe(true);
});

test('does not mark text-containing blocks', () => {
	const editor = setup(WITH_IMAGE);

	editor.commands.selectAll();

	expect(isMarked(editor, 'p')).toBe(false);
});
