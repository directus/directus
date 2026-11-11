// @vitest-environment jsdom
import { expect, test, vi } from 'vitest';
import { sanitizeRawHtml } from './raw-html-sanitize';

const unsupported = vi.hoisted(() => ({ value: false }));

vi.mock('dompurify', async (importOriginal) => {
	const original = await importOriginal<{ default: (window: Window) => object }>();

	return {
		default: (window: Window) =>
			new Proxy(original.default(window), {
				get: (target, key) => (key === 'isSupported' && unsupported.value ? false : Reflect.get(target, key)),
			}),
	};
});

const OFF = { keepInlineStyles: false, linkProtocols: [] };

const FA_ICON =
	'<svg class="svg-inline--fa fa-arrow-up-right-from-square" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-up-right-from-square" role="img" xmlns="http://www.w3.org/2000/svg" data-fa-i2svg=""></svg>';

const MAP =
	'<map name="rade_img_map_1497323218965" id="rade_img_map_1497323218965">\n<area href="http://" shape="RECT" coords="10,10,185,85"></map>';

test.each([
	['Font Awesome icon', FA_ICON],
	['RadEditor image map', MAP],
	['sprite icon', '<svg><use href="#icon-home"></use></svg>'],
	['sprite icon with xlink:href', '<svg><use xlink:href="#icon-home"></use></svg>'],
	['svg with viewBox and paths', '<svg viewBox="0 0 10 10"><title>t</title><path d="M0 0h10v10z"></path></svg>'],
])('%s is unchanged', (_n, html) => expect(sanitizeRawHtml(html, OFF)).toBe(html));

test.each([
	['script', '<svg><script>alert(1)</script></svg>', '<svg></svg>'],
	['onload', '<svg onload="alert(1)"></svg>', '<svg></svg>'],
	['foreignObject', '<svg><foreignObject><img src="x"></foreignObject></svg>', '<svg></svg>'],
	[
		'set rewriting href',
		'<svg><a href="/ok"><set attributeName="href" to="javascript:alert(1)"></set></a></svg>',
		'<svg><a href="/ok"></a></svg>',
	],
	['animate', '<svg><animate attributeName="x"></animate></svg>', '<svg></svg>'],
	[
		'use with an external href',
		'<svg><use href="https://x.test/sprite.svg#icon"></use></svg>',
		'<svg><use></use></svg>',
	],
	['use with a data: href', '<svg><use href="data:image/svg+xml,<svg></svg>#x"></use></svg>', '<svg><use></use></svg>'],
	['javascript: in svg a', '<svg><a href="javascript:alert(1)">x</a></svg>', '<svg><a>x</a></svg>'],
	['javascript: in xlink:href', '<svg><a xlink:href="javascript:alert(1)">x</a></svg>', '<svg><a>x</a></svg>'],
	['javascript: in area', '<map name="m"><area href="javascript:alert(1)"></map>', '<map name="m"><area></map>'],
	['style tag', '<svg><style>p{}</style></svg>', '<svg></svg>'],
	['style attribute', '<svg style="position: fixed"></svg>', '<svg></svg>'],
])('removes %s', (_n, input, expected) => expect(sanitizeRawHtml(input, OFF)).toBe(expected));

test('keeps style when keepInlineStyles is on', () => {
	const html = '<svg style="color: red;"><style>p{}</style></svg>';
	expect(sanitizeRawHtml(html, { keepInlineStyles: true, linkProtocols: [] })).toBe(html);
});

test('area href with a field protocol is kept only when the field allows it', () => {
	const html = '<map name="m"><area href="myapp://open/a"></map>';
	expect(sanitizeRawHtml(html, OFF)).toBe('<map name="m"><area></map>');
	expect(sanitizeRawHtml(html, { keepInlineStyles: false, linkProtocols: ['myapp'] })).toBe(html);
});

test('options do not leak between calls', () => {
	const html = '<svg style="color: red;"></svg>';
	sanitizeRawHtml(html, { keepInlineStyles: true, linkProtocols: ['myapp'] });
	expect(sanitizeRawHtml(html, OFF)).toBe('<svg></svg>');
});

test('an area keeps target', () => {
	const html = '<map name="m"><area shape="rect" coords="0,0,10,10" href="/x" target="_blank"></map>';
	expect(sanitizeRawHtml(html, OFF)).toBe(html);
});

test('returns nothing when DOMPurify is unsupported', () => {
	unsupported.value = true;
	expect(sanitizeRawHtml('<svg></svg>', OFF)).toBe('');
	unsupported.value = false;
});
