// @vitest-environment jsdom
import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { computeValueNormalizationDiff, roundTrip } from '../composables/normalization-diff';
import { RAW_HTML_NODE_NAMES } from './raw-html';
import { htmlToElement } from './raw-html-sanitize';
import { buildFieldSchema, editorExtensions } from './index';

const FA_ICON =
	'<svg class="svg-inline--fa fa-arrow-up-right-from-square" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="arrow-up-right-from-square" role="img" xmlns="http://www.w3.org/2000/svg" data-fa-i2svg=""></svg>';

const MAP =
	'<map name="rade_img_map_1497323218965" id="rade_img_map_1497323218965">\n<area href="http://" shape="RECT" coords="10,10,185,85"></map>';

const LINKED_ICON_BUTTON = `<a href="/nationalmuseum/content/open-call-details/collecting-contemporary-singapore---covid-19" class="btn-enquire-now dark-btn btn-rounded d-flex align-flex-start mt-5 mb-4">
<div class="it-btn-icon-bg it-icon-featured-box-bg d-flex align-center justify-center">
<div class="it-btn-icon">${FA_ICON}<!-- <i class="fa-solid fa-arrow-up-right-from-square"></i> Font Awesome fontawesome.com --></div>
</div>
<div class="text-bold pl-2">Find out more</div>
</a>`;

let editor: Editor | undefined;

afterEach(() => {
	editor?.destroy();
	editor = undefined;
});

function mount(content: string): Editor {
	editor = new Editor({ element: document.createElement('div'), extensions: editorExtensions, content });
	return editor;
}

test.each([
	['svg between paragraphs', `<p>a</p>${FA_ICON}<p>b</p>`],
	['svg inline in text', `<p>Go ${FA_ICON} now</p>`],
	['svg inside a link', `<p><a href="https://directus.io">${FA_ICON}</a></p>`],
	['svg inside a mark with text around', `<p>Go <strong>${FA_ICON}</strong> now</p>`],
	['top-level map', `<p>a</p>${MAP.replace('\n', '')}`],
	['svg beside an image', `<img src="/assets/abc">${FA_ICON}`],
	['sprite icon', '<p>Go <svg><use href="#icon-home"></use></svg> home</p>'],
	['svg with paths', '<p>a</p><svg viewBox="0 0 10 10"><path d="M0 0h10v10z"></path></svg><p>b</p>'],
	['map inside a paragraph', `<p>text ${MAP.replace('\n', '')} more</p>`],
])('%s round-trips unchanged', (_n, html) => expect(roundTrip(html)).toBe(html));

test("RadEditor map loses only the newline Tiptap's elementFromString removes", () => {
	expect(roundTrip(`<p>a</p>${MAP}`)).toBe(`<p>a</p>${MAP.replace('\n', '')}`);
});

test('svg alone in a list item stays inside the item', () => {
	expect(roundTrip(`<ul><li>${FA_ICON}</li></ul>`)).toBe(`<ul><li><p>${FA_ICON}</p></li></ul>`);
});

test('svg alone in a table cell stays a direct child of the cell', () => {
	expect(roundTrip(`<table><tbody><tr><td>${FA_ICON}</td></tr></tbody></table>`)).toBe(
		`<table style="min-width: 25px;"><colgroup><col style="min-width: 25px;"></colgroup><tbody><tr><td colspan="1" rowspan="1">${FA_ICON}</td></tr></tbody></table>`,
	);
});

test('a linked icon button keeps its link and the icon', () => {
	expect(roundTrip(LINKED_ICON_BUTTON)).toContain(
		`<a class="btn-enquire-now dark-btn btn-rounded d-flex align-flex-start mt-5 mb-4" href="/nationalmuseum/content/open-call-details/collecting-contemporary-singapore---covid-19">${FA_ICON}</a>`,
	);
});

test('svg parses as inline in text and as block between blocks', () => {
	const types = (content: string) => {
		const names: string[] = [];
		mount(content).state.doc.descendants((node) => void names.push(node.type.name));
		editor!.destroy();
		editor = undefined;
		return names;
	};

	expect(types(`<p>x ${FA_ICON}</p>`)).toContain('rawHtmlInline');
	expect(types(`<p>x ${FA_ICON}</p>`)).not.toContain('rawHtmlBlock');
	expect(types(FA_ICON)).toContain('rawHtmlBlock');
	expect(types(FA_ICON)).not.toContain('rawHtmlInline');
	expect(types(MAP)).toContain('rawHtmlBlock');
});

test('the chip never contains the stored HTML', () => {
	const instance = mount(`<p>x ${FA_ICON}</p><p>a</p>${MAP}`);
	const chips = instance.view.dom.querySelectorAll('.raw-html');
	expect(Array.from(chips, (c) => (c as HTMLElement).dataset['rawHtml'])).toEqual(['svg', 'map']);
	expect(instance.view.dom.querySelector('svg, map, area')).toBeNull();
	chips.forEach((c) => expect(c.getAttribute('contenteditable')).toBe('false'));
});

test('htmlToElement parses outside the live document', () => {
	expect(htmlToElement(FA_ICON)?.ownerDocument).not.toBe(document);
});

test('sanitizes on parse', () => {
	expect(roundTrip('<svg onload="alert(1)"></svg>')).toBe('<svg></svg>');
});

test('a DOM attribute named html cannot replace the sanitized value', () => {
	expect(roundTrip('<svg html="&lt;img src=x onerror=alert(1)&gt;"></svg>')).toBe('<svg></svg>');
});

test('preserved attributes are not added to raw html nodes', () => {
	const { schema } = mount('');

	for (const name of RAW_HTML_NODE_NAMES) {
		expect(Object.keys(schema.nodes[name]!.spec.attrs ?? {})).toEqual(['html']);
	}
});

test('attributes on svg round-trip through the stored html', () => {
	expect(roundTrip('<svg class="a" id="b" data-x="1"></svg>')).toBe('<svg class="a" id="b" data-x="1"></svg>');
});

test('keepInlineStyles keeps style inside svg', () => {
	const html = '<svg style="color: red;"></svg>';
	expect(roundTrip(html, buildFieldSchema({ keepInlineStyles: true }).extensions)).toBe(html);
	expect(roundTrip(html, buildFieldSchema({}).extensions)).toBe('<svg></svg>');
});

test('linkProtocols apply to area href', () => {
	const html = '<map name="m"><area href="myapp://open/a"></map>';
	expect(roundTrip(html, buildFieldSchema({ linkProtocols: ['myapp'] }).extensions)).toBe(html);
	expect(roundTrip(html, buildFieldSchema({}).extensions)).toBe('<map name="m"><area></map>');
});

test('an image map keeps usemap and its map', () => {
	const html =
		'<img src="/assets/abc" alt="a" usemap="#m"><map name="m"><area shape="rect" coords="0,0,10,10" href="/x"></map>';

	expect(roundTrip(html)).toBe(html);
});

describe('normalization warning', () => {
	test.each([
		['Font Awesome icon in a link', `<p><a href="https://directus.io">${FA_ICON}</a></p>`],
		['RadEditor map', MAP],
		['svg the browser rewrites', '<svg viewBox="0 0 10 10"><path d="M0 0h10v10z"/></svg>'],
	])('%s does not show the warning', (_n, html) => expect(computeValueNormalizationDiff(html)).toBeNull());

	test('an area with target does not show the warning', () => {
		const html = '<map name="m"><area shape="rect" coords="0,0,10,10" href="/x" target="_blank"></map>';
		expect(computeValueNormalizationDiff(html)).toBeNull();
	});

	test.each([
		['onload', '<svg onload="alert(1)"></svg>'],
		['script in svg', '<svg><script>alert(1)</script></svg>'],
		['javascript: area', '<map name="m"><area href="javascript:alert(1)"></map>'],
	])('a sanitizer removal (%s) shows the warning', (_n, html) =>
		expect(computeValueNormalizationDiff(html)).not.toBeNull(),
	);

	test('a newline between inline elements outside svg and map still counts', () => {
		expect(computeValueNormalizationDiff('<p><b>a</b>\n<i>b</i></p>')).toEqual([
			{ count: 2, added: false, removed: true, value: '<p><b>a</b>\n<i>b</i></p>' },
			{ count: 1, added: true, removed: false, value: '<p><strong>a</strong><em>b</em></p>' },
		]);
	});

	test('comparison mode keeps svg the same way', () => {
		const html = `<p>Go ${FA_ICON} now</p>`;
		expect(roundTrip(html, buildFieldSchema({ comparisonMode: true }).extensions)).toBe(html);
	});
});

describe('paste', () => {
	const pasteEvent = () => new Event('paste') as ClipboardEvent;

	test('strips onload from a pasted svg', () => {
		const instance = mount('');
		instance.view.pasteHTML('<p>x <svg onload="alert(1)"></svg></p>', pasteEvent());
		expect(instance.getHTML()).toContain('<svg></svg>');
		expect(instance.getHTML()).not.toContain('onload');
	});

	test('keeps a pasted Font Awesome icon', () => {
		const instance = mount('');
		instance.view.pasteHTML(`<p>x ${FA_ICON}</p>`, pasteEvent());
		expect(instance.getHTML()).toBe(`<p>x ${FA_ICON}</p>`);
	});
});
