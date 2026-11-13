// @vitest-environment jsdom
import { getSchema } from '@tiptap/core';
import { expect, test } from 'vitest';
import { buildFieldSchema, editorExtensions, fieldEditorExtensions } from '../extensions';
import { findMarkupLoss } from './markup-loss';
import { roundTrip } from './normalization-diff';

const schema = getSchema(editorExtensions);

const FA_ICON =
	'<svg class="svg-inline--fa fa-arrow-up-right-from-square" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-up-right-from-square" role="img" xmlns="http://www.w3.org/2000/svg" data-fa-i2svg=""><path fill="currentColor" d="M320 0c-17.7 0-32 14.3-32 32z"></path></svg>';

const MAP =
	'<map name="rade_img_map_1497323218965" id="rade_img_map_1497323218965">\n<area href="http://" shape="RECT" coords="10,10,185,85"></map>';

function loss(html: string): string[] {
	return findMarkupLoss(html, roundTrip(html), schema);
}

test('a kept svg and map report no loss', () => {
	expect(loss(`<p>x ${FA_ICON}</p>${MAP}`)).toEqual([]);
});

test.each([
	['a removed attribute', '<svg class="a" onload="alert(1)"></svg>'],
	['a removed child', '<svg class="a"><script>alert(1)</script><rect></rect></svg>'],
	['a removed area href', '<map name="m"><area alt="x" href="javascript:alert(1)"></map>'],
])('%s inside a kept element is a loss', (_n, html) => expect(loss(html)).not.toEqual([]));

const FORMS = buildFieldSchema({ keepFormElements: true }).extensions;
const formSchema = getSchema(fieldEditorExtensions(FORMS));

function formLoss(html: string): string[] {
	return findMarkupLoss(html, roundTrip(html, FORMS), formSchema);
}

test('a kept form and a loose control report no loss', () => {
	expect(formLoss('<form action="/s">\n<input name="q">\n</form><p>a <button type="button">b</button></p>')).toEqual(
		[],
	);
});

test('a loose label reports no loss with the option and a loss without it', () => {
	const html = '<div><label for="fullName">Full Name:</label></div><div><input id="fullName" name="fullName"></div>';
	expect(formLoss(html)).toEqual([]);
	expect(loss(html)).toContain('<label for="fullName">');
});

test('a form is a loss without the option', () => {
	expect(loss('<form action="/s"><input name="q"></form>')).not.toEqual([]);
});

test('a removed handler inside a kept form is a loss', () => {
	expect(formLoss('<form action="/s"><button onclick="alert(1)">b</button></form>')).not.toEqual([]);
});
