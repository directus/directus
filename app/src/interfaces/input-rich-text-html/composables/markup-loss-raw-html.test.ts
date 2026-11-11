// @vitest-environment jsdom
import { getSchema } from '@tiptap/core';
import { expect, test } from 'vitest';
import { editorExtensions } from '../extensions';
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

test('a removed attribute names only that attribute', () => {
	expect(loss('<svg class="a" onload="alert(1)"></svg>')).toEqual(['<svg onload="alert(1)">']);
});

test('a removed child names the child, not the kept root', () => {
	const lost = loss('<svg class="a"><script>alert(1)</script><rect></rect></svg>');
	expect(lost).toContain('<script>');
	expect(lost.some((tag) => tag.startsWith('<svg'))).toBe(false);
});

test('a removed attribute on a map area names the area', () => {
	expect(loss('<map name="m"><area alt="x" href="javascript:alert(1)"></map>')).toEqual([
		'<area href="javascript:alert(1)">',
	]);
});
