// @vitest-environment jsdom
import { getSchema } from '@tiptap/core';
import { Editor } from '@tiptap/vue-3';
import { afterEach, describe, expect, test } from 'vitest';
import { findMarkupLoss } from '../composables/markup-loss';
import { computeValueNormalizationDiff, roundTrip } from '../composables/normalization-diff';
import { htmlToElement } from './raw-html-sanitize';
import { buildFieldSchema, editorExtensions, fieldEditorExtensions } from './index';

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

describe('form elements', () => {
	const FORMS = buildFieldSchema({ keepFormElements: true }).extensions;

	const SEARCH_FORM =
		'<form action="/search" method="get" class="search-form" id="site-search"><label for="q">Search</label><input type="text" id="q" name="q" placeholder="Keywords" required=""><select name="scope"><option value="all" selected="">All</option></select><textarea name="note" rows="3"></textarea><button type="submit" name="go" value="go" formaction="/search/advanced">Go</button></form>';

	function mountForms(content: string): Editor {
		editor = new Editor({
			element: document.createElement('div'),
			extensions: fieldEditorExtensions(FORMS),
			content,
		});

		return editor;
	}

	function types(content: string): string[] {
		const names: string[] = [];
		mountForms(content).state.doc.descendants((node) => void names.push(node.type.name));
		return names;
	}

	test.each([
		['form between paragraphs', `<p>a</p>${SEARCH_FORM}<p>b</p>`],
		['button inline in text', '<p>Click <button type="button">here</button> now</p>'],
		['input inline in text', '<p>Name <input type="text" name="full_name"></p>'],
		['select inside a link', '<p><a href="/x"><select name="s"><option value="1">1</option></select></a></p>'],
		['top-level loose input', '<p>a</p><input type="hidden" name="token" value="x">'],
		[
			'form inside a table cell',
			`<table style="min-width: 25px;"><colgroup><col style="min-width: 25px;"></colgroup><tbody><tr><td colspan="1" rowspan="1">${SEARCH_FORM}</td></tr></tbody></table>`,
		],
	])('%s round-trips unchanged', (_n, html) => {
		expect(roundTrip(html, FORMS)).toBe(html);
		expect(computeValueNormalizationDiff(html, FORMS, 'forms')).toBeNull();
	});

	test('a form loses only the newlines elementFromString removes', () => {
		const html = '<form action="/s">\n<input name="q">\n<button>Go</button>\n</form>';
		expect(roundTrip(html, FORMS)).toBe('<form action="/s"><input name="q"><button>Go</button></form>');
		expect(computeValueNormalizationDiff(html, FORMS, 'forms')).toBeNull();
	});

	test('without the option, a form is removed and shows the warning', () => {
		expect(roundTrip(SEARCH_FORM)).not.toContain('<form');
		expect(computeValueNormalizationDiff(SEARCH_FORM)).not.toBeNull();
	});

	test('a form is always a block, a loose control follows its context', () => {
		expect(types(SEARCH_FORM)).toContain('rawHtmlBlock');
		editor!.destroy();
		expect(types(`<ul><li>${SEARCH_FORM}</li></ul>`)).not.toContain('rawHtmlInline');
		editor!.destroy();
		expect(types('<p>a <button>b</button></p>')).toContain('rawHtmlInline');
		editor!.destroy();
		expect(types('<button>b</button>')).toContain('rawHtmlBlock');
	});

	test('a form after text in a list item stays in the item', () => {
		expect(roundTrip(`<ul><li>a${SEARCH_FORM}</li></ul>`, FORMS)).toBe(`<ul><li><p>a</p>${SEARCH_FORM}</li></ul>`);
	});

	// a list item must start with a paragraph, and ProseMirror moves a leading block out instead of adding one
	test('a form that starts a list item is kept, and the move shows the warning', () => {
		const html = `<ul><li>${SEARCH_FORM}</li></ul>`;
		expect(roundTrip(html, FORMS)).toContain(SEARCH_FORM);
		expect(computeValueNormalizationDiff(html, FORMS, 'forms')).not.toBeNull();
	});

	test('controls inside a form are part of the form', () => {
		const instance = mountForms(SEARCH_FORM);
		const chips = instance.view.dom.querySelectorAll('.raw-html');
		expect(Array.from(chips, (c) => (c as HTMLElement).dataset['rawHtml'])).toEqual(['form']);
		expect(instance.view.dom.querySelector('form, input, button, select, textarea')).toBeNull();
	});

	test.each([
		['onsubmit', '<form action="/s" onsubmit="alert(1)"></form>', '<form action="/s"></form>'],
		['javascript: action', '<form action="javascript:alert(1)"></form>', '<form></form>'],
		[
			'javascript: formaction',
			'<form><button formaction="javascript:alert(1)">Go</button></form>',
			'<form><button>Go</button></form>',
		],
		[
			'onclick on a loose button',
			'<button type="button" onclick="alert(1)">Go</button>',
			'<button type="button">Go</button>',
		],
		['onfocus on a loose input', '<p>a <input onfocus="alert(1)" autofocus></p>', '<p>a <input></p>'],
	])('removes %s', (_n, input, expected) => {
		expect(roundTrip(input, FORMS)).toBe(expected);
		expect(computeValueNormalizationDiff(input, FORMS, 'forms')).not.toBeNull();
	});

	test('adjacent controls share one inline context and keep the space between them', () => {
		const html =
			'<div class="buttons"><button type="button">Audio</button>\n        <button type="button">Video</button></div>';

		const wrapped = buildFieldSchema({
			keepFormElements: true,
			keepWrapperElements: true,
			noContainerParagraphs: true,
		});

		const out = roundTrip(html, wrapped.extensions);

		expect(out).toBe(
			'<div class="buttons"><button type="button">Audio</button> <button type="button">Video</button></div>',
		);

		expect(findMarkupLoss(html, out, getSchema(fieldEditorExtensions(wrapped.extensions)))).toEqual([]);
	});

	test.each([
		['label beside its control', '<p><label for="q">Name</label> <input id="q" name="q"></p>'],
		['label around its control', '<p><label>搜索<input type="search"></label></p>'],
		['label with a form attribute', '<p><label for="q" form="f">Name</label></p>'],
		[
			'label with bold text',
			'<p><label for="full-name"><strong>Na</strong>me</label> <input id="full-name" name="full-name"></p>',
		],
		[
			'label with italic and a link',
			'<p><label for="q"><em>Name</em> <a href="https://example.com">info</a></label></p>',
		],
	])('%s round-trips unchanged', (_n, html) => {
		expect(roundTrip(html, FORMS)).toBe(html);
		expect(computeValueNormalizationDiff(html, FORMS, 'forms')).toBeNull();
	});

	test('label text stays editable', () => {
		const instance = mountForms('<p><label for="q">Name</label></p>');
		instance.chain().setTextSelection(3).insertContent('-').run();
		expect(instance.getHTML()).toBe('<p><label for="q">Na-me</label></p>');
	});

	test('without the option, a label loses its for attribute', () => {
		expect(roundTrip('<p><label for="q">Name</label></p>')).toBe('<p>Name</p>');
	});

	test('the option is part of the schema key', () => {
		expect(buildFieldSchema({ keepFormElements: true }).key).not.toBe(buildFieldSchema({}).key);
	});
});
