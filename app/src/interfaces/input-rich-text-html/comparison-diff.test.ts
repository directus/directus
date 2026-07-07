import { Editor } from '@tiptap/vue-3';
import { describe, expect, test } from 'vitest';
import { editorExtensions } from './extensions';
import { ComparisonDiff } from './extensions/comparison-diff';

/**
 * Comparison mode (CMS-2649): the comparison view feeds the editor diff-marked HTML
 * (`use-comparison-diff.ts` wraps changed text runs in `span.comparison-diff--added|--removed`).
 * The ComparisonDiff mark lets those spans survive schema parsing; it is registered only in
 * comparison mode, so the normal editing schema strips them (guard test below).
 */
function roundTrip(html: string, extensions: any[] = [...editorExtensions, ComparisonDiff]): string {
	const editor = new Editor({ extensions, content: html });
	const out = editor.getHTML();
	editor.destroy();
	return out;
}

describe('with ComparisonDiff registered', () => {
	const CASES: Record<string, string> = {
		'added span': '<p>Hello <span class="comparison-diff--added">world</span></p>',
		'removed span': '<p>Hello <span class="comparison-diff--removed">old world</span></p>',
		'both in one paragraph':
			'<p><span class="comparison-diff--removed">old</span> <span class="comparison-diff--added">new</span></p>',
		'span in heading': '<h2>Title <span class="comparison-diff--removed">old</span></h2>',
		'span in list item': '<ul><li><p><span class="comparison-diff--added">item</span></p></li></ul>',
		'span nested in bold': '<p><strong>bold <span class="comparison-diff--added">new</span></strong></p>',
		'span inside link': '<p><a href="https://directus.io"><span class="comparison-diff--added">link</span></a></p>',
	};

	for (const [name, html] of Object.entries(CASES)) {
		test(`${name} survives round-trip`, () => {
			expect(roundTrip(html)).toBe(html);
		});
	}
});

describe('without ComparisonDiff (normal editing schema)', () => {
	test('diff spans are stripped', () => {
		const html = '<p>Hello <span class="comparison-diff--added">world</span></p>';
		expect(roundTrip(html, [...editorExtensions])).toBe('<p>Hello world</p>');
	});
});
