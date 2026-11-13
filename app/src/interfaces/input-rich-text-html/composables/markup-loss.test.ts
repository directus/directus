import { getSchema } from '@tiptap/core';
import { describe, expect, test } from 'vitest';
import { buildFieldSchema, editorExtensions, fieldEditorExtensions } from '../extensions';
import { buildCustomFormats } from '../extensions/custom-formats';
import { findMarkupLoss } from './markup-loss';
import { roundTrip } from './normalization-diff';

const schema = getSchema(editorExtensions);

function loss(html: string): string[] {
	return findMarkupLoss(html, roundTrip(html), schema);
}

describe('findMarkupLoss', () => {
	// every case here is rewritten by the schema, and none of them loses anything
	describe('harmless rewrites', () => {
		test.each([
			['tag aliases', '<p>Hello <b>bold</b> <i>it</i> <strike>s</strike></p>'],
			['reordered link attributes', '<p><a href="https://x.test" target="_blank">x</a></p>'],
			['implied table wrappers and spans', '<table><tr><td>a</td><td colspan="2">b</td></tr></table>'],
			['implied paragraph in a blockquote', '<blockquote>quoted</blockquote>'],
			['implied paragraphs in a nested list', '<ul><li>a<ul><li>b</li></ul></li></ul>'],
			['ordered list start and type', '<ol start="3" type="a"><li>c</li></ol>'],
			['image inside a paragraph', '<p>before<img src="https://x.test/a.png" alt="A">after</p>'],
			[
				'linked image inside a heading',
				'<h2>t <a href="https://x.test"><img src="https://x.test/a.png" alt="A"></a></h2>',
			],
			[
				'image lifted out of a table cell',
				'<table><tr><td>before<img src="https://x.test/a.png" alt="A">after</td></tr></table>',
			],
			['reserialized CSS', '<p><span style="font-size:11pt;color:#FF0000">w</span></p>'],
			[
				'styles that become marks',
				'<p><span style="font-weight:bold">b</span> <span style="font-style:italic">i</span></p>',
			],
			['styles that clear marks', '<p><b style="font-weight:400">plain</b></p>'],
			// browsers list this shorthand as four `text-decoration-*` longhands no rule names
			[
				'shorthand styles that become marks',
				'<p><span style="text-decoration:underline">u</span> <span style="text-decoration:line-through">s</span></p>',
			],
			['unwrapped bare wrappers', '<div><span>plain</span></div><p><o:p></o:p>word</p>'],
			['preserved global attributes', '<h1 class="x" id="y" data-k="v" title="t">h</h1>'],
			['non-content elements', '<style>p{}</style><p>s</p><script>1</script>'],
			['trailing whitespace at a block boundary', '<p>The content is pretty awesome </p>'],
			['a trailing hard break', '<p>a<br></p>'],
		])('%s', (_name, html) => {
			expect(loss(html)).toEqual([]);
		});
	});

	describe('genuine loss', () => {
		test('an inline style on an inline image', () => {
			expect(loss('<p>a<img src="https://x.test/a.png" style="float: left;">b</p>')).toEqual([
				'<img style="float: left">',
			]);
		});

		test('an inline style no rule claims', () => {
			expect(loss('<p><span style="white-space: pre-wrap;" data-metadata="figma">Grass</span></p>')).toEqual([
				'<span style="white-space: pre-wrap">',
			]);
		});

		test('a block style no rule claims', () => {
			expect(loss('<p style="line-height:1.38;margin-top:0pt">gd</p>')).toEqual([
				'<p style="line-height: 1.38; margin-top: 0pt">',
			]);
		});

		test('an unknown element with attributes', () => {
			expect(loss('<p><font color="red">f</font></p>')).toEqual(['<font color="red">']);
		});

		test('an attribute the element type does not model', () => {
			expect(loss('<p align="center">c</p>')).toEqual(['<p align="center">']);
		});

		test('an embedded element the parser ignores', () => {
			expect(loss('<p>keep</p><object data="about:blank"></object>')).toEqual(['<object data="about:blank">']);
		});

		test('a link the schema refuses', () => {
			// the `a` is unwrapped, so its href goes with it
			expect(loss('<p><a href="javascript:alert(1)">x</a></p>')).toEqual(['<a href="javascript:alert(1)">']);
		});

		test('a style mark the schema drops keeps the whole open tag', () => {
			// a mark type reachable only through a style rule that the schema does not render
			expect(loss('<p><span style="text-decoration: none">x</span></p>')).toEqual([
				'<span style="text-decoration: none">',
			]);
		});

		test('missing text', () => {
			expect(findMarkupLoss('<p>a b</p>', '<p>a</p>', schema)).toEqual(['#text']);
		});
	});

	// custom-format marks live only on the editor instance, so their schema must be the one asked
	test('custom-format markup survives when its schema is supplied', () => {
		const { extensions } = buildCustomFormats([{ title: 'Highlight', inline: 'span', classes: 'highlight' }]);
		const html = '<p><span class="highlight">hi</span></p>';
		const withFormats = getSchema([...editorExtensions, ...extensions]);

		expect(findMarkupLoss(html, roundTrip(html, extensions), withFormats)).toEqual([]);
	});

	describe('with keepInlineStyles', () => {
		const { extensions } = buildFieldSchema({ keepInlineStyles: true });
		const inlineSchema = getSchema(fieldEditorExtensions(extensions));
		const inlineLoss = (html: string) => findMarkupLoss(html, roundTrip(html, extensions), inlineSchema);

		test.each([
			['a block style', '<p style="line-height:1.38;margin-top:0pt">gd</p>'],
			['an inline style', '<p><span style="white-space: pre-wrap;" data-metadata="figma">Grass</span></p>'],
			[
				'styles mixed with owned ones',
				'<p style="text-align:center;margin-left:40px"><span style="color:red;letter-spacing:1px">a</span></p>',
			],
			['a <style> tag', '<style type="text/css">p { color: red; }</style><p>s</p>'],
			['a <style> tag inside a paragraph', '<p>a<style>p { color: red; }</style>b</p>'],
		])('%s is kept', (_name, html) => {
			expect(inlineLoss(html)).toEqual([]);
		});

		test('reports the part of a shorthand that only its owner keeps as lost', () => {
			expect(inlineLoss('<p><span style="background: yellow url(a.png)">x</span></p>')).toEqual([
				expect.stringContaining('background-image'),
			]);
		});

		test('an attribute a <style> tag does not model', () => {
			expect(inlineLoss('<style nonce="abc">p { color: red; }</style>')).toEqual(['<style nonce="abc">']);
		});
	});

	describe('with keepInlineStyles and keepLegacyEmphasisTags', () => {
		const { extensions } = buildFieldSchema({ keepInlineStyles: true, keepLegacyEmphasisTags: true });
		const bothSchema = getSchema(fieldEditorExtensions(extensions));

		test.each([
			['a styled <b>', '<p><b style="text-transform: uppercase;">a</b> <i style="color: red;">b</i></p>'],
			['a <style> tag next to a legacy tag', '<style>b { color: red; }</style><p><b>a</b></p>'],
		])('%s is kept', (_name, html) => {
			expect(findMarkupLoss(html, roundTrip(html, extensions), bothSchema)).toEqual([]);
		});
	});
});
