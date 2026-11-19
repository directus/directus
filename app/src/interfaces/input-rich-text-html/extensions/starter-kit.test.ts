import { type AnyExtension, Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { roundTrip } from '../composables/normalization-diff';
import { buildLegacyEmphasisSchema } from './starter-kit';
import { buildFieldSchema, editorExtensions, fieldEditorExtensions } from '.';

const LEGACY = '<p><b>bold</b> and <i>italic</i></p>';
const { extensions: keep } = buildLegacyEmphasisSchema(true);

const editors: Editor[] = [];

afterEach(() => {
	while (editors.length) editors.pop()!.destroy();
});

function editorWith(content: string): Editor {
	const editor = new Editor({ extensions: fieldEditorExtensions(keep), content });
	editors.push(editor);
	return editor;
}

describe('buildLegacyEmphasisSchema', () => {
	test('rewrites <b> and <i> to <strong> and <em> by default', () => {
		expect(roundTrip(LEGACY)).toBe('<p><strong>bold</strong> and <em>italic</em></p>');
	});

	test('keeps <b> and <i> when enabled', () => {
		expect(roundTrip(LEGACY, keep)).toBe(LEGACY);
	});

	test('keeps <strong> and <em> when enabled', () => {
		const html = '<p><strong>bold</strong> and <em>italic</em></p>';
		expect(roundTrip(html, keep)).toBe(html);
	});

	test('keeps adjacent runs with different tags apart', () => {
		const html = '<p><b>a</b><strong>b</strong><i>c</i><em>d</em></p>';
		expect(roundTrip(html, keep)).toBe(html);
	});

	test('keeps nested legacy tags and attributes', () => {
		const html = '<p><b class="x">bold <i>both</i></b></p>';
		expect(roundTrip(html, keep)).toBe(html);
	});

	test('writes <strong> for bold from a font-weight style', () => {
		expect(roundTrip('<p><span style="font-weight: bold;">x</span></p>', keep)).toBe('<p><strong>x</strong></p>');
	});

	test('still drops <b> with font-weight normal', () => {
		expect(roundTrip('<p><b style="font-weight: normal;">x</b></p>', keep)).toBe('<p>x</p>');
	});

	test('the toolbar commands create <strong> and <em>', () => {
		const editor = editorWith('<p>text</p>');
		editor.chain().selectAll().toggleBold().toggleItalic().run();
		expect(editor.getHTML()).toBe('<p><strong><em>text</em></strong></p>');
	});

	test('the toolbar commands remove a legacy mark', () => {
		const editor = editorWith(LEGACY);
		editor.chain().selectAll().unsetBold().unsetItalic().run();
		expect(editor.getHTML()).toBe('<p>bold and italic</p>');
	});

	test('the toolbar commands extend a legacy mark instead of splitting it', () => {
		const editor = editorWith('<p><b>ab</b>cd <i>ef</i>gh</p>');

		editor
			.chain()
			.setTextSelection({ from: 2, to: 4 })
			.toggleBold()
			.setTextSelection({ from: 7, to: 9 })
			.setItalic()
			.run();

		expect(editor.getHTML()).toBe('<p><b>abc</b>d <i>efg</i>h</p>');
	});

	test('a toolbar command over legacy and plain text gives one tag', () => {
		const editor = editorWith('<p><b>ab</b>cd</p>');
		editor.chain().selectAll().toggleBold().run();
		expect(editor.getHTML()).toBe('<p><b>abcd</b></p>');
	});

	test('a legacy tag that wraps its modern form keeps only the inner tag', () => {
		expect(roundTrip('<p><b><strong>x</strong></b></p>', keep)).toBe('<p><strong>x</strong></p>');
	});

	test('text typed inside a legacy mark keeps its tag', () => {
		const editor = editorWith('<p><b>bold</b></p>');
		editor.chain().setTextSelection(3).insertContent('X').run();
		expect(editor.getHTML()).toBe('<p><b>boXld</b></p>');
	});

	test('ignores values other than true', () => {
		expect(buildLegacyEmphasisSchema(false)).toEqual({ extensions: [], key: '' });
		expect(buildLegacyEmphasisSchema('true')).toEqual({ extensions: [], key: '' });
	});
});

describe('buildFieldSchema keepLegacyEmphasisTags', () => {
	test('keeps the mark order of the default schema', () => {
		const marks = (extensions: AnyExtension[]) => {
			const editor = new Editor({ extensions });
			editors.push(editor);
			return Object.keys(editor.schema.marks);
		};

		const { extensions } = buildFieldSchema({ keepLegacyEmphasisTags: true });

		expect(marks(fieldEditorExtensions(extensions))).toEqual(marks(editorExtensions));
	});

	test('keeps the default nesting of bold and italic with other marks', () => {
		const html = '<p><b><s>a</s></b> <i><u>b</u></i> <s><b>c</b></s></p>';
		const out = '<p><strong><s>a</s></strong> <em><u>b</u></em> <strong><s>c</s></strong></p>';

		expect(roundTrip(html)).toBe(out);
		expect(roundTrip(html, keep)).toBe('<p><b><s>a</s></b> <i><u>b</u></i> <b><s>c</s></b></p>');
	});

	test('gives the field schema its own key', () => {
		expect(buildFieldSchema({ keepLegacyEmphasisTags: true }).key).not.toBe(buildFieldSchema().key);
	});
});
