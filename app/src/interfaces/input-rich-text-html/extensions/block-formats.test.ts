import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { applyBlockFormat, clearBlockFormat, isBlockFormatActive, toggleBlockFormat } from './block-formats';
import { type BlockCustomFormat, buildCustomFormats } from './custom-formats';
import { editorExtensions } from './index';

let editor: Editor;

afterEach(() => editor?.destroy());

/** Builds one block format from a raw entry, failing loudly if the entry was rejected. */
function blockFormat(entry: Record<string, unknown>): BlockCustomFormat {
	const format = buildCustomFormats([entry]).formats[0];
	if (format?.kind !== 'block') throw new Error(`entry did not build a block format: ${JSON.stringify(entry)}`);
	return format;
}

function editorWith(content: string): Editor {
	editor = new Editor({ extensions: editorExtensions, content });
	return editor;
}

const DROPCAP = { title: 'Dropcap', block: 'p', classes: 'dropcap' };
const EYEBROW = { title: 'Eyebrow', block: 'h2', classes: 'eyebrow' };
const LEAD = { title: 'Lead', selector: 'p', classes: 'lead' };

describe('applyBlockFormat', () => {
	test('applies the format classes to the block holding the cursor', () => {
		const editor = editorWith('<p>hello</p>');
		applyBlockFormat(editor, blockFormat(DROPCAP));

		expect(editor.getHTML()).toBe('<p class="dropcap">hello</p>');
	});

	test('merges into classes the block already carries', () => {
		const editor = editorWith('<p class="intro">hello</p>');
		applyBlockFormat(editor, blockFormat(DROPCAP));

		expect(editor.getHTML()).toBe('<p class="intro dropcap">hello</p>');
	});

	test('applying twice does not duplicate the class', () => {
		const editor = editorWith('<p>hello</p>');
		const format = blockFormat(DROPCAP);
		applyBlockFormat(editor, format);
		applyBlockFormat(editor, format);

		expect(editor.getHTML()).toBe('<p class="dropcap">hello</p>');
	});

	test('applies the configured preserved attributes alongside the classes', () => {
		const editor = editorWith('<p>hello</p>');

		applyBlockFormat(
			editor,
			blockFormat({
				title: 'Latex',
				block: 'p',
				classes: 'latex',
				attributes: { id: 'eq', 'data-latex': 'true', 'aria-label': 'equation' },
			}),
		);

		const html = editor.getHTML();
		expect(html).toContain('class="latex"');
		expect(html).toContain('id="eq"');
		expect(html).toContain('data-latex="true"');
		expect(html).toContain('aria-label="equation"');
	});

	test('converts the block when the configured tag differs', () => {
		const editor = editorWith('<p>hello</p>');
		applyBlockFormat(editor, blockFormat(EYEBROW));

		// TrailingNode keeps an editable paragraph after a trailing heading; unrelated to the format
		expect(editor.getHTML()).toBe('<h2 class="eyebrow">hello</h2><p></p>');
	});

	test('converting between heading levels retargets the level', () => {
		const editor = editorWith('<h3>hello</h3>');
		applyBlockFormat(editor, blockFormat(EYEBROW));

		expect(editor.getHTML()).toBe('<h2 class="eyebrow">hello</h2><p></p>');
	});

	test('a selector format applies without changing the tag', () => {
		const editor = editorWith('<p>hello</p>');
		applyBlockFormat(editor, blockFormat(LEAD));

		expect(editor.getHTML()).toBe('<p class="lead">hello</p>');
	});

	test('a selector format no-ops on a block of another type', () => {
		const editor = editorWith('<h2>hello</h2>');
		applyBlockFormat(editor, blockFormat(LEAD));

		expect(editor.getHTML()).toBe('<h2>hello</h2>');
	});

	test('a selector format reaches an ancestor block the cursor sits inside', () => {
		const editor = editorWith('<blockquote><p>hello</p></blockquote>');
		applyBlockFormat(editor, blockFormat({ title: 'Pull', selector: 'blockquote', classes: 'pull' }));

		expect(editor.getHTML()).toBe('<blockquote class="pull"><p>hello</p></blockquote><p></p>');
	});

	test('a selector format applies to a node the semantic-html extensions model', () => {
		const editor = editorWith('<dl><dt>term</dt><dd><p>definition</p></dd></dl>');
		editor.commands.selectAll();
		applyBlockFormat(editor, blockFormat({ title: 'Term', selector: 'dt', classes: 'term' }));

		expect(editor.getHTML()).toContain('<dt class="term">term</dt>');
	});

	test('applies to every block in a multi-block selection', () => {
		const editor = editorWith('<p>one</p><p>two</p>');
		editor.commands.selectAll();
		applyBlockFormat(editor, blockFormat(DROPCAP));

		expect(editor.getHTML()).toBe('<p class="dropcap">one</p><p class="dropcap">two</p>');
	});

	test('leaves blocks outside the selection untouched', () => {
		const editor = editorWith('<p>one</p><p>two</p>');
		editor.commands.setTextSelection(2);
		applyBlockFormat(editor, blockFormat(DROPCAP));

		expect(editor.getHTML()).toBe('<p class="dropcap">one</p><p>two</p>');
	});
});

describe('clearBlockFormat', () => {
	test('removes only the format classes and drops an emptied class attribute', () => {
		const editor = editorWith('<p class="dropcap">hello</p>');
		clearBlockFormat(editor, blockFormat(DROPCAP));

		expect(editor.getHTML()).toBe('<p>hello</p>');
	});

	test('leaves unrelated classes and preserved attributes intact', () => {
		const editor = editorWith('<p class="intro dropcap" id="x" data-k="v" aria-label="l">hello</p>');
		clearBlockFormat(editor, blockFormat(DROPCAP));

		expect(editor.getHTML()).toBe('<p class="intro" id="x" data-k="v" aria-label="l">hello</p>');
	});

	test('keeps the tag when clearing a format that converted the block', () => {
		const editor = editorWith('<h2 class="eyebrow">hello</h2>');
		clearBlockFormat(editor, blockFormat(EYEBROW));

		expect(editor.getHTML()).toBe('<h2>hello</h2><p></p>');
	});

	test('removes only the attributes the format configured', () => {
		const editor = editorWith('<p class="latex" id="eq" data-latex="true" data-other="keep">hello</p>');

		clearBlockFormat(
			editor,
			blockFormat({ title: 'Latex', block: 'p', classes: 'latex', attributes: { id: 'eq', 'data-latex': 'true' } }),
		);

		expect(editor.getHTML()).toBe('<p data-other="keep">hello</p>');
	});

	test('clears every block in a multi-block selection', () => {
		const editor = editorWith('<p class="dropcap">one</p><p class="dropcap">two</p>');
		editor.commands.selectAll();
		clearBlockFormat(editor, blockFormat(DROPCAP));

		expect(editor.getHTML()).toBe('<p>one</p><p>two</p>');
	});
});

// `listItem` is `paragraph block*`, so re-typing its leading paragraph is not a valid transform
describe('blocks whose parent rejects the converted type', () => {
	test('leaves a list item alone and still formats the rest of the selection', () => {
		const editor = editorWith('<p>lead</p><ul><li><p>item</p></li></ul>');
		editor.commands.setTextSelection({ from: 0, to: 14 });

		applyBlockFormat(editor, blockFormat(EYEBROW));

		const html = editor.getHTML();
		expect(html).toContain('<h2 class="eyebrow">lead</h2>');
		expect(html).toContain('<li><p>item</p></li>');
	});

	test('does not read as active from a list item the format cannot reach', () => {
		const editor = editorWith('<ul><li><p>item</p></li></ul>');
		editor.commands.setTextSelection(4);

		expect(isBlockFormatActive(editor, blockFormat(EYEBROW))).toBe(false);
	});

	test('converts a non-leading paragraph in a list item, which the parent does accept', () => {
		const editor = editorWith('<ul><li><p>one</p><p>two</p></li></ul>');
		editor.commands.setTextSelection(11);

		applyBlockFormat(editor, blockFormat(EYEBROW));

		expect(editor.getHTML()).toContain('<li><p>one</p><h2 class="eyebrow">two</h2></li>');
	});
});

// A conversion makes TrailingNode append an empty paragraph, and the mapped Select All end drifts
// past it. Counting that paragraph as a target would grow the doc on every click and keep the format
// from ever reading as active.
describe('select all', () => {
	test('a converting format reads as active and toggles back off', () => {
		const editor = editorWith('<p>hello</p>');
		const format = blockFormat(EYEBROW);
		editor.commands.selectAll();

		toggleBlockFormat(editor, format);
		expect(editor.getHTML()).toBe('<h2 class="eyebrow">hello</h2><p></p>');
		expect(isBlockFormatActive(editor, format)).toBe(true);

		toggleBlockFormat(editor, format);
		expect(editor.getHTML()).toBe('<h2>hello</h2><p></p>');
	});

	test('applying a converting format twice does not grow the doc', () => {
		const editor = editorWith('<p>hello</p>');
		const format = blockFormat(EYEBROW);
		editor.commands.selectAll();

		applyBlockFormat(editor, format);
		applyBlockFormat(editor, format);

		expect(editor.getHTML()).toBe('<h2 class="eyebrow">hello</h2><p></p>');
	});

	test('reading a stored converted block does not offer the trailing paragraph as a target', () => {
		const editor = editorWith('<h2 class="eyebrow">hello</h2>');
		editor.commands.selectAll();

		expect(isBlockFormatActive(editor, blockFormat(EYEBROW))).toBe(true);
	});

	test('still formats an empty block the cursor sits in', () => {
		const editor = editorWith('<p>hello</p><p></p>');
		editor.commands.setTextSelection(9);

		applyBlockFormat(editor, blockFormat(DROPCAP));

		expect(editor.getHTML()).toBe('<p>hello</p><p class="dropcap"></p>');
	});

	test('still formats an empty block a drag selection ends in', () => {
		const editor = editorWith('<p>hello</p><p></p>');
		editor.commands.setTextSelection({ from: 1, to: 9 });

		applyBlockFormat(editor, blockFormat(DROPCAP));

		expect(editor.getHTML()).toBe('<p class="dropcap">hello</p><p class="dropcap"></p>');
	});
});

describe('isBlockFormatActive', () => {
	test('false on an unformatted block, true once applied', () => {
		const editor = editorWith('<p>hello</p>');
		const format = blockFormat(DROPCAP);

		expect(isBlockFormatActive(editor, format)).toBe(false);
		applyBlockFormat(editor, format);
		expect(isBlockFormatActive(editor, format)).toBe(true);
	});

	test('true for a stored class the editor parsed, not just a freshly applied one', () => {
		const editor = editorWith('<p class="dropcap">hello</p>');
		expect(isBlockFormatActive(editor, blockFormat(DROPCAP))).toBe(true);
	});

	test('a convert format is inactive while the block is still the wrong type', () => {
		const editor = editorWith('<p class="eyebrow">hello</p>');
		expect(isBlockFormatActive(editor, blockFormat(EYEBROW))).toBe(false);
	});

	test('false when no block in range is eligible', () => {
		const editor = editorWith('<h2>hello</h2>');
		expect(isBlockFormatActive(editor, blockFormat(LEAD))).toBe(false);
	});

	test('a multi-block selection is active only when every block carries the format', () => {
		const editor = editorWith('<p class="dropcap">one</p><p>two</p>');
		const format = blockFormat(DROPCAP);
		editor.commands.selectAll();

		expect(isBlockFormatActive(editor, format)).toBe(false);
		applyBlockFormat(editor, format);
		expect(isBlockFormatActive(editor, format)).toBe(true);
	});

	test('an attributes-only format matches on its attributes, not on any block', () => {
		const editor = editorWith('<p>hello</p>');
		const format = blockFormat({ title: 'Latex', block: 'p', attributes: { 'data-latex': 'true' } });

		expect(isBlockFormatActive(editor, format)).toBe(false);
		applyBlockFormat(editor, format);
		expect(isBlockFormatActive(editor, format)).toBe(true);
	});
});

describe('toggleBlockFormat', () => {
	test('applies when inactive and clears when active', () => {
		const editor = editorWith('<p class="intro">hello</p>');
		const format = blockFormat(DROPCAP);

		toggleBlockFormat(editor, format);
		expect(editor.getHTML()).toBe('<p class="intro dropcap">hello</p>');

		toggleBlockFormat(editor, format);
		expect(editor.getHTML()).toBe('<p class="intro">hello</p>');
	});

	test('a convert format toggled off keeps the converted tag', () => {
		const editor = editorWith('<p>hello</p>');
		const format = blockFormat(EYEBROW);

		toggleBlockFormat(editor, format);
		toggleBlockFormat(editor, format);

		expect(editor.getHTML()).toBe('<h2>hello</h2><p></p>');
	});

	test('is a single undo step for a multi-block selection', () => {
		const editor = editorWith('<p>one</p><p>two</p>');
		editor.commands.selectAll();
		toggleBlockFormat(editor, blockFormat(DROPCAP));
		editor.commands.undo();

		expect(editor.getHTML()).toBe('<p>one</p><p>two</p>');
	});
});

// Each shape must survive the full authoring loop: apply, store, reparse, toggle off. Every block
// starts with an unrelated class that has to be intact at the end.
describe('round trip: apply → save → reload → toggle off', () => {
	const CASES = [
		{
			shape: 'block, tag unchanged',
			entry: DROPCAP,
			content: '<p class="intro">hello</p>',
			stored: '<p class="intro dropcap">hello</p>',
			cleared: '<p class="intro">hello</p>',
		},
		{
			shape: 'block, tag converted',
			entry: EYEBROW,
			content: '<p class="intro">hello</p>',
			stored: '<h2 class="intro eyebrow">hello</h2><p></p>',
			cleared: '<h2 class="intro">hello</h2><p></p>',
		},
		{
			shape: 'selector',
			entry: LEAD,
			content: '<p class="intro">hello</p>',
			stored: '<p class="intro lead">hello</p>',
			cleared: '<p class="intro">hello</p>',
		},
		{
			shape: 'attributes only',
			entry: { title: 'Latex', block: 'p', attributes: { 'data-latex': 'true' } },
			content: '<p class="intro">hello</p>',
			stored: '<p class="intro" data-latex="true">hello</p>',
			cleared: '<p class="intro">hello</p>',
		},
	];

	test.each(CASES)('$shape', ({ entry, content, stored, cleared }) => {
		const first = editorWith(content);
		toggleBlockFormat(first, blockFormat(entry));
		expect(first.getHTML()).toBe(stored);

		const reloaded = new Editor({ extensions: editorExtensions, content: first.getHTML() });
		toggleBlockFormat(reloaded, blockFormat(entry));
		const out = reloaded.getHTML();
		reloaded.destroy();

		expect(out).toBe(cleared);
	});
});

// The reported use cases from https://community.directus.com/t/new-tiptap-wysiwyg-editor/2439
describe('community thread cases', () => {
	test('applies a float class to an image and strips it again', () => {
		const editor = editorWith('<img src="/assets/a.png" alt="a">');
		const format = blockFormat({ title: 'Float left', selector: 'img', classes: 'float-left' });
		editor.commands.selectAll();

		toggleBlockFormat(editor, format);
		expect(editor.getHTML()).toContain('class="float-left"');

		editor.commands.selectAll();
		expect(isBlockFormatActive(editor, format)).toBe(true);

		toggleBlockFormat(editor, format);
		expect(editor.getHTML()).not.toContain('float-left');
	});

	// The view adds `ProseMirror-selectednode` to the selected image's DOM node; serialization reads
	// the document, so the stored class list must hold the format's class and nothing else.
	test('the view-only selected-node class never reaches the stored HTML', () => {
		const editor = editorWith('<img src="/assets/a.png" alt="a">');
		editor.commands.setNodeSelection(0);
		applyBlockFormat(editor, blockFormat({ title: 'Float left', selector: 'img', classes: 'float-left' }));

		expect(editor.getHTML()).toBe('<img class="float-left" src="/assets/a.png" alt="a"><p></p>');
	});

	test('applies a class to a list item without touching its siblings', () => {
		const editor = editorWith('<ul><li><p>one</p></li><li><p>two</p></li></ul>');
		editor.commands.setTextSelection(4);
		applyBlockFormat(editor, blockFormat({ title: 'Tick', selector: 'li', classes: 'tick' }));

		const html = editor.getHTML();
		expect(html).toContain('<li class="tick"><p>one</p></li>');
		expect(html).toContain('<li><p>two</p></li>');
	});

	test('applies a class to a table cell', () => {
		const editor = editorWith('<table><tbody><tr><td><p>a</p></td><td><p>b</p></td></tr></tbody></table>');
		editor.commands.setTextSelection(5);
		applyBlockFormat(editor, blockFormat({ title: 'Numeric', selector: 'td', classes: 'numeric' }));

		expect(editor.getHTML()).toContain('class="numeric"');
	});
});
