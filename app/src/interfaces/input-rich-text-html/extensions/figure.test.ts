import { Extension } from '@tiptap/core';
import { Plugin } from '@tiptap/pm/state';
import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { editorExtensions } from './index';

const editors: Editor[] = [];

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

/**
 * Every fixture ends with this paragraph: StarterKit's trailing-node plugin appends an empty one on
 * the first transaction whenever the doc ends in a non-paragraph, which would show up in every
 * assertion. `html()` strips it back off.
 */
const TAIL = '<p>after</p>';

function setup(content: string) {
	const editor = new Editor({ extensions: editorExtensions, content: content + TAIL });
	editors.push(editor);
	return editor;
}

function html(editor: Editor): string {
	const out = editor.getHTML();
	return out.endsWith(TAIL) ? out.slice(0, -TAIL.length) : out;
}

/** Selects the first node of `type` in the document. */
function selectNode(editor: Editor, type: string) {
	let pos: number | undefined;

	editor.state.doc.descendants((node, nodePos) => {
		if (pos === undefined && node.type.name === type) pos = nodePos;
	});

	expect(pos, `no ${type} node in the document`).toBeDefined();
	editor.commands.setNodeSelection(pos!);
	return pos!;
}

/** Places the text cursor at the end of the first node of `type`. */
function focusEndOf(editor: Editor, type: string) {
	const pos = selectNode(editor, type);
	const node = editor.state.doc.nodeAt(pos)!;
	editor.commands.setTextSelection(pos + node.nodeSize - 1);
}

const REPLACE_DOC_META = 'test-replace-doc';

/**
 * Stands in for any plugin that appends a whole-document replacement: registered last so its plugin
 * runs before the figure one, which then sees the replacement as a *later* transaction in the batch.
 */
const replaceDocOnMeta = Extension.create({
	name: 'testReplaceDocOnMeta',

	addProseMirrorPlugins() {
		return [
			new Plugin({
				appendTransaction: (transactions, _oldState, newState) => {
					if (!transactions.some((transaction) => transaction.getMeta(REPLACE_DOC_META))) return null;

					const { schema } = newState;

					return newState.tr.replaceWith(0, newState.doc.content.size, [
						schema.nodes['figure']!.create(null, schema.nodes['figcaption']!.create(null, schema.text('A caption'))),
						schema.nodes['paragraph']!.create(null, schema.text('after')),
					]);
				},
			}),
		];
	},
});

describe('setFigure', () => {
	test('wraps the selected image', () => {
		const editor = setup('<img src="/assets/abc" alt="photo">');

		selectNode(editor, 'image');
		editor.commands.setFigure();

		expect(html(editor)).toBe('<figure><img src="/assets/abc" alt="photo"></figure>');
	});

	test('does not nest a figure inside a figure', () => {
		const editor = setup('<figure><img src="/assets/abc" alt="photo"></figure>');

		selectNode(editor, 'image');
		editor.commands.setFigure();

		expect(html(editor)).toBe('<figure><img src="/assets/abc" alt="photo"></figure>');
	});
});

describe('unsetFigure', () => {
	test('lifts the image out and discards the caption', () => {
		const editor = setup('<figure><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure>');

		selectNode(editor, 'image');
		editor.commands.unsetFigure();

		expect(html(editor)).toBe('<img src="/assets/abc" alt="photo">');
	});

	test('keeps every non-caption child', () => {
		const editor = setup('<figure><pre><code>const x = 1;</code></pre><figcaption>A caption</figcaption></figure>');

		focusEndOf(editor, 'codeBlock');
		editor.commands.unsetFigure();

		expect(html(editor)).toBe('<pre><code>const x = 1;</code></pre>');
	});

	test('a caption-only figure leaves an empty paragraph behind', () => {
		const editor = setup('<figure><figcaption>A caption</figcaption></figure>');

		focusEndOf(editor, 'figcaption');
		editor.commands.unsetFigure();

		expect(html(editor)).toBe('<p></p>');
	});

	test('is a no-op outside a figure', () => {
		const editor = setup('<p>text</p>');

		expect(editor.commands.unsetFigure()).toBe(false);
		expect(html(editor)).toBe('<p>text</p>');
	});
});

describe('setFigureCaption', () => {
	test('wraps a bare image and adds the caption after it', () => {
		const editor = setup('<img src="/assets/abc" alt="photo">');

		selectNode(editor, 'image');
		editor.commands.setFigureCaption('A caption');

		expect(html(editor)).toBe('<figure><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure>');
	});

	test('replaces the text of an existing caption in place', () => {
		const editor = setup('<figure><img src="/assets/abc" alt="photo"><figcaption>Old</figcaption></figure>');

		selectNode(editor, 'image');
		editor.commands.setFigureCaption('New');

		expect(html(editor)).toBe('<figure><img src="/assets/abc" alt="photo"><figcaption>New</figcaption></figure>');
	});

	test('keeps a caption authored before the image in place', () => {
		const editor = setup('<figure><figcaption>Old</figcaption><img src="/assets/abc" alt="photo"></figure>');

		selectNode(editor, 'image');
		editor.commands.setFigureCaption('New');

		expect(html(editor)).toBe('<figure><figcaption>New</figcaption><img src="/assets/abc" alt="photo"></figure>');
	});

	test('keeps the caption element attributes when replacing its text', () => {
		const editor = setup(
			'<figure><img src="/assets/abc" alt="photo"><figcaption class="cap" id="c1">Old</figcaption></figure>',
		);

		selectNode(editor, 'image');
		editor.commands.setFigureCaption('New');

		expect(html(editor)).toBe(
			'<figure><img src="/assets/abc" alt="photo"><figcaption class="cap" id="c1">New</figcaption></figure>',
		);
	});

	test('keeps the figure attributes when adding a caption', () => {
		const editor = setup('<figure class="float-left"><img src="/assets/abc" alt="photo"></figure>');

		selectNode(editor, 'image');
		editor.commands.setFigureCaption('A caption');

		expect(html(editor)).toBe(
			'<figure class="float-left"><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure>',
		);
	});
});

describe('unsetFigureCaption', () => {
	test('removes the caption and unwraps a plain figure', () => {
		const editor = setup('<figure><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure>');

		selectNode(editor, 'image');
		editor.commands.unsetFigureCaption();

		expect(html(editor)).toBe('<img src="/assets/abc" alt="photo">');
	});

	test('keeps a figure that carries preserved attributes', () => {
		const editor = setup(
			'<figure class="float-left"><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure>',
		);

		selectNode(editor, 'image');
		editor.commands.unsetFigureCaption();

		expect(html(editor)).toBe('<figure class="float-left"><img src="/assets/abc" alt="photo"></figure>');
	});

	test('keeps a figure that groups a non-image block', () => {
		const editor = setup('<figure><pre><code>const x = 1;</code></pre><figcaption>A caption</figcaption></figure>');

		focusEndOf(editor, 'codeBlock');
		editor.commands.unsetFigureCaption();

		expect(html(editor)).toBe('<figure><pre><code>const x = 1;</code></pre></figure>');
	});

	test('is a no-op on a figure without a caption', () => {
		const editor = setup('<figure class="float-left"><img src="/assets/abc" alt="photo"></figure>');

		selectNode(editor, 'image');

		expect(editor.commands.unsetFigureCaption()).toBe(false);
		expect(html(editor)).toBe('<figure class="float-left"><img src="/assets/abc" alt="photo"></figure>');
	});

	test('does not unwrap a plain figure that never had a caption', () => {
		const editor = setup('<figure><img src="/assets/abc" alt="photo"></figure>');

		selectNode(editor, 'image');

		expect(editor.commands.unsetFigureCaption()).toBe(false);
		expect(html(editor)).toBe('<figure><img src="/assets/abc" alt="photo"></figure>');
	});
});

describe('caption editing', () => {
	test('the caption is an editable text position, not an atom', () => {
		const editor = setup('<figure><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure>');

		focusEndOf(editor, 'figcaption');
		editor.commands.insertContent(' edited');

		expect(html(editor)).toBe(
			'<figure><img src="/assets/abc" alt="photo"><figcaption>A caption edited</figcaption></figure>',
		);
	});
});

describe('caption keymap', () => {
	test('Enter inside a caption leaves the figure', () => {
		const editor = setup('<figure><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure>');

		focusEndOf(editor, 'figcaption');
		editor.view.someProp('handleKeyDown', (fn) => fn(editor.view, new KeyboardEvent('keydown', { key: 'Enter' })));

		expect(html(editor)).toBe(
			'<figure><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure><p></p>',
		);
	});

	test('Backspace in an empty caption removes it', () => {
		const editor = setup('<figure><img src="/assets/abc" alt="photo"><figcaption></figcaption></figure>');

		focusEndOf(editor, 'figcaption');
		editor.view.someProp('handleKeyDown', (fn) => fn(editor.view, new KeyboardEvent('keydown', { key: 'Backspace' })));

		expect(html(editor)).toBe('<img src="/assets/abc" alt="photo">');
	});
});

describe('orphan caption cleanup', () => {
	test('deleting the image removes the figure with it', () => {
		const editor = setup('<figure><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure>');

		selectNode(editor, 'image');
		editor.commands.deleteSelection();

		expect(html(editor)).toBe('');
	});

	test('deleting one of two images keeps the figure', () => {
		const editor = setup(
			'<figure><img src="/assets/a" alt="a"><img src="/assets/b" alt="b"><figcaption>A caption</figcaption></figure>',
		);

		selectNode(editor, 'image');
		editor.commands.deleteSelection();

		expect(html(editor)).toBe('<figure><img src="/assets/b" alt="b"><figcaption>A caption</figcaption></figure>');
	});

	test('a stored caption-only figure survives being loaded and edited elsewhere', () => {
		const editor = setup('<figure class="media-left"><figcaption>A caption</figcaption></figure><p>text</p>');

		focusEndOf(editor, 'paragraph');
		editor.commands.insertContent('!');

		expect(html(editor)).toBe('<figure class="media-left"><figcaption>A caption</figcaption></figure><p>text!</p>');
	});

	test('replacing the whole document is left alone', () => {
		const editor = setup('<figure><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure>');

		editor.commands.setContent('<figure class="media-left"><figcaption>A caption</figcaption></figure>' + TAIL);

		expect(html(editor)).toBe('<figure class="media-left"><figcaption>A caption</figcaption></figure>');
	});

	test('a whole-document replacement appended by another plugin is left alone', () => {
		const editor = new Editor({
			extensions: [...editorExtensions, replaceDocOnMeta],
			content: '<figure><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure>' + TAIL,
		});

		editors.push(editor);

		editor.view.dispatch(editor.state.tr.setMeta(REPLACE_DOC_META, true));

		expect(html(editor)).toBe('<figure><figcaption>A caption</figcaption></figure>');
	});
});
