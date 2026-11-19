import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { roundTrip as schemaRoundTrip } from './composables/normalization-diff';
import { buildFieldSchema, fieldEditorExtensions, type FieldSchemaOptions } from './extensions';

let editor: Editor | null = null;

afterEach(() => {
	editor?.destroy();
	editor = null;
});

const withInlineStyles = (options: FieldSchemaOptions = {}) =>
	buildFieldSchema({ keepInlineStyles: true, ...options }).extensions;

function mount(html: string): Editor {
	editor = new Editor({ extensions: fieldEditorExtensions(withInlineStyles()), content: html });
	return editor;
}

function roundTrip(html: string, keepInlineStyles = true): string {
	return schemaRoundTrip(html, buildFieldSchema({ keepInlineStyles }).extensions);
}

describe('keepInlineStyles off', () => {
	test('drops style values the schema does not model', () => {
		expect(roundTrip('<p style="margin-left: 40px;">a</p>', false)).toBe('<p>a</p>');
	});

	test('drops <style> tags', () => {
		expect(roundTrip('<style>p { color: red; }</style><p>a</p>', false)).toBe('<p>a</p>');
	});
});

describe('keepInlineStyles on: style attribute', () => {
	test.each([
		['paragraph', '<p style="margin-left: 40px;">a</p>'],
		['heading', '<h2 style="letter-spacing: 2px;">a</h2>'],
		['span with an unmodeled property', '<p><span style="white-space: pre-wrap;">text</span></p>'],
		['list', '<ul style="list-style-type: square;"><li><p>a</p></li></ul>'],
		['list item', '<ul><li style="margin-bottom: 4px;"><p>a</p></li></ul>'],
		['blockquote', '<blockquote style="padding-left: 8px;"><p>a</p></blockquote>'],
		['bold mark', '<p><strong style="text-transform: uppercase;">a</strong></p>'],
		['link', '<p><a style="text-decoration: none;" href="https://directus.io">a</a></p>'],
		['semicolon inside url()', '<p style="background-image: url(&quot;data:image/png;base64,AAAA&quot;);">a</p>'],
	])('%s survives round-trip unchanged', (_name, html) => {
		expect(roundTrip(html)).toBe(html);
	});

	// ProseMirror writes `style` through the CSSOM, so the browser's serialization is what gets stored
	test('CSS is stored in the browser serialization', () => {
		expect(roundTrip('<p style="margin-left:40px;padding:0">a</p>')).toBe(
			'<p style="margin-left: 40px; padding: 0px;">a</p>',
		);
	});

	test('a property the text alignment extension owns is written once', () => {
		expect(roundTrip('<p style="margin-left: 40px; text-align: center;">a</p>')).toBe(
			'<p style="text-align: center; margin-left: 40px;">a</p>',
		);
	});

	test('a property the text style extension owns is written once', () => {
		expect(roundTrip('<p><span style="white-space: pre-wrap; color: #ff0000;">text</span></p>')).toBe(
			'<p><span style="color: #ff0000; white-space: pre-wrap;">text</span></p>',
		);
	});

	test('a shorthand that sets an owned property is left to the owner', () => {
		const out = roundTrip('<p><span style="background: yellow;">text</span></p>');

		expect(out).toContain('background-color: yellow');
		expect(out).not.toContain('background:');
	});

	test('changing an owned property leaves no stale copy behind', () => {
		const instance = mount('<p><span style="color: #ff0000; white-space: pre-wrap;">text</span></p>');
		instance.chain().selectAll().setColor('#00ff00').run();

		const out = instance.getHTML();
		expect(out).toContain('color: #00ff00');
		expect(out).not.toContain('#ff0000');
		expect(out).toContain('white-space: pre-wrap');
	});

	test.each([
		['bold', '<p><span style="font-weight: bold;">a</span></p>', '<p><strong>a</strong></p>'],
		['italic', '<p style="font-style: italic; margin-left: 4px;">a</p>', '<p style="margin-left: 4px;"><em>a</em></p>'],
		['underline', '<p><span style="text-decoration: underline;">a</span></p>', '<p><u>a</u></p>'],
		[
			'bold through a shorthand',
			'<p><span style="font: bold 12px Arial;">a</span></p>',
			'<p><span style="font-family: Arial; font-size: 12px;"><strong>a</strong></span></p>',
		],
	])('a %s declaration that becomes a mark is not kept as style too', (_name, html, expected) => {
		expect(roundTrip(html)).toBe(expected);
	});

	test('a font weight that is not bold stays a style', () => {
		const html = '<p><span style="font-weight: 300;">a</span></p>';
		expect(roundTrip(html)).toBe(html);
	});

	test.each([
		['span in a heading', '<h2><span style="font-weight: 400;">a</span></h2>'],
		['heading', '<h2 style="font-weight: 400;">a</h2>'],
		['span with another property', '<p><span style="font-weight: 400; letter-spacing: 2px;">a</span></p>'],
		['span in a heading, font-style', '<h2><span style="font-style: normal;">a</span></h2>'],
	])('a declaration that only clears a mark stays a style: %s', (_name, html) => {
		expect(roundTrip(html)).toBe(html);
	});

	test('a declaration that clears an outer mark keeps its style and leaves that mark off', () => {
		expect(roundTrip('<p><strong>a <span style="font-weight: 400;">b</span></strong></p>')).toBe(
			'<p><strong>a </strong><span style="font-weight: 400;">b</span></p>',
		);
	});

	test('removing a mark that came from a style removes the style too', () => {
		const instance = mount('<p><span style="font-weight: bold; letter-spacing: 1px;">a</span></p>');
		instance.chain().selectAll().unsetBold().run();

		expect(instance.getHTML()).toBe('<p><span style="letter-spacing: 1px;">a</span></p>');
	});

	test('a second round trip changes nothing', () => {
		const html =
			'<h2 style="text-align: center; margin: 0 auto;">t</h2><p><span style="color: #ff0000; font-size: 18pt; line-height: 2;">a</span> <em style="color: blue;">b</em></p>';

		const once = roundTrip(html);
		expect(roundTrip(once)).toBe(once);
	});

	test.each([
		[
			'table and cell',
			'<table style="width: 100%;"><tbody><tr><td style="padding: 4px;"><p>a</p></td></tr></tbody></table>',
		],
		['image', '<img style="float: left; margin: 4px;" src="/assets/a">'],
		['figure', '<figure style="margin: 0px;"><img src="/assets/a"><figcaption>c</figcaption></figure>'],
		['iframe', '<iframe style="border: 0px;" src="about:blank"></iframe>'],
	])('%s keeps its style', (_name, html) => {
		const out = roundTrip(html);

		for (const declaration of html.match(/style="[^"]*"/g)!) expect(out).toContain(declaration);
	});

	test('a custom format span keeps the declarations its format does not set', () => {
		const customFormats = JSON.stringify([
			{ title: 'W', inline: 'span', classes: 'wrapper', styles: { color: '#00ff00' } },
		]);

		const html = '<p><span class="wrapper" style="color: #00ff00; letter-spacing: 1px;">x</span></p>';

		expect(schemaRoundTrip(html, withInlineStyles({ customFormats }))).toBe(html);
	});

	test('nested styled spans merge into one without losing a declaration', () => {
		expect(roundTrip('<p><span style="color: red;"><span style="font-weight: 300;">a</span></span></p>')).toBe(
			'<p><span style="color: red; font-weight: 300;">a</span></p>',
		);
	});

	test('the style attribute does not leak onto a <style> tag', () => {
		expect(roundTrip('<style style="color: red;">p { color: red; }</style>')).toBe('<style>p { color: red; }</style>');
	});
});

describe('keepInlineStyles on: <style> tags', () => {
	test.each([
		['top-level tag', '<style>p { color: red; }</style><p>a</p>'],
		['CSS with child combinators and quotes', `<style>.a > .b::before { content: "x"; }</style>`],
		['media and type attributes', '<style media="print" type="text/css">p { color: red; }</style>'],
		['class and id', '<style class="theme" id="theme">p { color: red; }</style>'],
		['empty tag', '<style></style><p>a</p>'],
	])('%s survives round-trip unchanged', (_name, html) => {
		expect(roundTrip(html)).toBe(html);
	});

	test('a tag inside a paragraph is lifted out without losing text', () => {
		expect(roundTrip('<p>a<style>p { color: red; }</style>b</p>')).toBe(
			'<p>a</p><style>p { color: red; }</style><p>b</p>',
		);
	});

	test('the editor never renders a live <style> element', () => {
		const instance = mount('<style>body { display: none; }</style><p>a</p>');

		expect(instance.view.dom.querySelector('style')).toBeNull();
		expect(instance.view.dom.querySelector('[data-style-tag]')?.textContent).toContain('body { display: none; }');
	});
});

describe('keepInlineStyles with keepLegacyEmphasisTags', () => {
	const extensions = buildFieldSchema({ keepInlineStyles: true, keepLegacyEmphasisTags: true }).extensions;

	test.each([
		['styled <b>', '<p><b style="text-transform: uppercase;">a</b></p>'],
		['styled <i> with a class', '<p><i class="x" style="letter-spacing: 2px;">a</i></p>'],
		[
			'legacy and modern tags in a styled block',
			'<p style="margin-left: 40px;"><b>a</b><strong>b</strong><i>c</i><em>d</em></p>',
		],
		['a <style> tag next to a legacy tag', '<style>b { color: red; }</style><p><b>a</b></p>'],
	])('%s survives round-trip unchanged', (_name, html) => {
		expect(schemaRoundTrip(html, extensions)).toBe(html);
	});

	test('a bold declaration still becomes <strong>', () => {
		expect(schemaRoundTrip('<p><span style="font-weight: bold; letter-spacing: 1px;">a</span></p>', extensions)).toBe(
			'<p><span style="letter-spacing: 1px;"><strong>a</strong></span></p>',
		);
	});

	test('the schema key differs from each option alone', () => {
		const key = buildFieldSchema({ keepInlineStyles: true, keepLegacyEmphasisTags: true }).key;

		expect(key).not.toBe(buildFieldSchema({ keepInlineStyles: true }).key);
		expect(key).not.toBe(buildFieldSchema({ keepLegacyEmphasisTags: true }).key);
	});
});

describe('buildFieldSchema', () => {
	test('the option changes the schema key', () => {
		expect(buildFieldSchema({ keepInlineStyles: true }).key).not.toBe(buildFieldSchema().key);
	});
});
