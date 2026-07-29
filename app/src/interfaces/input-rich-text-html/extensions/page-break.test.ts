import { Editor } from '@tiptap/vue-3';
import { describe, expect, test } from 'vitest';
import { decodePageBreaks, encodePageBreaks, PAGE_BREAK_NODE } from './page-break';
import { editorExtensions } from './index';

function newEditor(html: string): Editor {
	return new Editor({ extensions: editorExtensions, content: html });
}

describe('decodePageBreaks', () => {
	test('converts the marker to the editor element', () => {
		expect(decodePageBreaks('<p>a</p><!-- pagebreak --><p>b</p>')).toBe('<p>a</p><div data-page-break></div><p>b</p>');
	});

	test('tolerates whitespace inside the comment', () => {
		expect(decodePageBreaks('<!--pagebreak-->')).toBe('<div data-page-break></div>');
		expect(decodePageBreaks('<!--   pagebreak   -->')).toBe('<div data-page-break></div>');
	});

	test('converts every occurrence', () => {
		expect(decodePageBreaks('<!-- pagebreak --><!-- pagebreak -->')).toBe(
			'<div data-page-break></div><div data-page-break></div>',
		);
	});

	test('leaves content without markers untouched', () => {
		expect(decodePageBreaks('<p>no breaks here</p>')).toBe('<p>no breaks here</p>');
	});
});

describe('encodePageBreaks', () => {
	test('converts the rendered element back to the marker', () => {
		const rendered = '<div data-page-break="true" class="page-break" contenteditable="false"></div>';
		expect(encodePageBreaks(`<p>a</p>${rendered}<p>b</p>`)).toBe('<p>a</p><!-- pagebreak --><p>b</p>');
	});

	test('converts every occurrence', () => {
		const rendered = '<div data-page-break="true" class="page-break" contenteditable="false"></div>';
		expect(encodePageBreaks(`${rendered}${rendered}`)).toBe('<!-- pagebreak --><!-- pagebreak -->');
	});

	test('leaves content without page breaks untouched', () => {
		expect(encodePageBreaks('<p>just text</p>')).toBe('<p>just text</p>');
	});
});

describe('page-break node', () => {
	test('parses the decoded element into a pageBreak node', () => {
		const editor = newEditor(decodePageBreaks('<p>a</p><!-- pagebreak --><p>b</p>'));
		const types = editor.getJSON().content?.map((node) => node.type);
		editor.destroy();
		expect(types).toContain('pageBreak');
	});

	test('inserting the node (toolbar button) renders the page-break element', () => {
		const editor = newEditor('<p>a</p>');
		editor.chain().focus().insertContent({ type: PAGE_BREAK_NODE }).run();
		const html = editor.getHTML();
		editor.destroy();
		expect(html).toContain('data-page-break');
	});

	test('the legacy marker round-trips unchanged through the value boundary', () => {
		const editor = newEditor(decodePageBreaks('<p>a</p><!-- pagebreak --><p>b</p>'));
		const out = encodePageBreaks(editor.getHTML());
		editor.destroy();
		expect(out).toBe('<p>a</p><!-- pagebreak --><p>b</p>');
	});
});
