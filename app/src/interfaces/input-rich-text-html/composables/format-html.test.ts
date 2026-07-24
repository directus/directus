import { Editor } from '@tiptap/vue-3';
import { describe, expect, test } from 'vitest';
import { editorExtensions } from '../extensions';
import { formatHtml } from './format-html';

/** Canonical HTML the schema produces for a given input. */
function canonical(html: string): string {
	const editor = new Editor({ extensions: editorExtensions, content: html });
	const out = editor.getHTML();
	editor.destroy();
	return out;
}

/** Formatted HTML fed back through the editor — what a save of unedited source produces. */
function reparse(html: string): string {
	const editor = new Editor({ extensions: editorExtensions, content: html });
	const out = editor.getHTML();
	editor.destroy();
	return out;
}

const SAMPLES: Record<string, string> = {
	paragraph: '<p>Just a paragraph.</p>',
	'nested marks': '<p>hello <strong>bold <em>and italic</em></strong> world</p>',
	'bullet list': '<ul><li><p>one</p></li><li><p>two</p></li></ul>',
	'nested list': '<ul><li><p>parent</p><ul><li><p>child</p></li></ul></li></ul>',
	blockquote: '<blockquote><p>quote</p></blockquote>',
	'horizontal rule': '<p>before</p><hr><p>after</p>',
	'code block': '<pre><code>const x = 1;\n  indented();</code></pre>',
	headings: '<h1>H1</h1><h2>H2</h2>',
	link: '<p><a href="https://directus.io">link</a></p>',
	image: '<img src="/assets/abc" alt="alt">',
};

describe('formatHtml', () => {
	test('indents nested block structure', () => {
		expect(formatHtml('<ul><li><p>one</p></li></ul>')).toBe(
			['<ul>', '  <li>', '    <p>one</p>', '  </li>', '</ul>'].join('\n'),
		);
	});

	test('keeps inline content on a single line', () => {
		expect(formatHtml('<p>hello <strong>world</strong></p>')).toBe('<p>hello <strong>world</strong></p>');
	});

	test('leaves <pre> contents untouched', () => {
		expect(formatHtml('<pre><code>a\n  b</code></pre>')).toBe('<pre><code>a\n  b</code></pre>');
	});

	test('trims boundary whitespace inside an inline-only block', () => {
		expect(formatHtml('<p> hello world </p>')).toBe('<p>hello world</p>');
	});

	test('trims boundary whitespace nested inside inline marks', () => {
		expect(formatHtml('<p>hi <em>there </em></p>')).toBe('<p>hi <em>there</em></p>');
	});

	test('keeps trailing whitespace inside <pre>', () => {
		expect(formatHtml('<pre><code>a </code></pre>')).toBe('<pre><code>a </code></pre>');
	});

	test('preserves a non-breaking space at the block boundary', () => {
		// A non-breaking space is significant and survives Tiptap normalization, so it must not be trimmed.
		expect(formatHtml('<p>hello\u00a0</p>')).toBe('<p>hello&nbsp;</p>');
	});

	test('preserves HTML comments between blocks', () => {
		expect(formatHtml('<p>Testing this</p><!-- comment --><p>Check it out</p>')).toBe(
			['<p>Testing this</p>', '<!-- comment -->', '<p>Check it out</p>'].join('\n'),
		);
	});

	// Why it's safe: open drawer → save unchanged must never mutate the value.
	describe('round-trips: formatted HTML re-parses to the canonical document', () => {
		test.each(Object.entries(SAMPLES))('%s', (_name, html) => {
			const original = canonical(html);
			expect(reparse(formatHtml(original))).toBe(original);
		});
	});
});
