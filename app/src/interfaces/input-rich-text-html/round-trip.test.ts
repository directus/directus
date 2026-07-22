import { Editor } from '@tiptap/vue-3';
import { describe, expect, test } from 'vitest';
import { editorExtensions } from './extensions';
import { decodePageBreaks, encodePageBreaks } from './extensions/page-break';

/**
 * HTML corpus round-trip tests: representative legacy-TinyMCE HTML through `setContent → getHTML`,
 * snapshotted so any change in round-trip fidelity shows up in review. There is no global raw-HTML
 * passthrough — the schema is the source of truth; anything it can't represent is restored by an
 * extension (semantic tags, preserved attributes) or normalized away (see snapshots).
 */
function roundTrip(html: string): string {
	// same comment ↔ element boundary as input-rich-text-html.vue, so page breaks round-trip identically
	const editor = new Editor({ extensions: editorExtensions, content: decodePageBreaks(html) });
	const out = encodePageBreaks(editor.getHTML());
	editor.destroy();
	return out;
}

/** Constructs the schema models — these must survive round-trip without structural loss. */
const FAITHFUL: Record<string, string> = {
	paragraph: '<p>Just a paragraph.</p>',
	headings: '<h1>H1</h1><h2>H2</h2><h3>H3</h3><h4>H4</h4><h5>H5</h5><h6>H6</h6>',
	bold: '<p><strong>bold</strong></p>',
	italic: '<p><em>italic</em></p>',
	underline: '<p><u>underline</u></p>',
	strike: '<p><s>strike</s></p>',
	subscript: '<p>H<sub>2</sub>O</p>',
	superscript: '<p>x<sup>2</sup></p>',
	'inline code': '<p><code>inline()</code></p>',
	'inline code within text': '<p>run <code>npm install</code> to start</p>',
	'nested marks': '<p><strong>bold <em>and italic</em></strong></p>',
	'bullet list': '<ul><li><p>one</p></li><li><p>two</p></li></ul>',
	'ordered list': '<ol><li><p>first</p></li><li><p>second</p></li></ol>',
	'nested list': '<ul><li><p>parent</p><ul><li><p>child</p></li></ul></li></ul>',
	blockquote: '<blockquote><p>quote</p></blockquote>',
	'horizontal rule': '<p>before</p><hr><p>after</p>',
	'code block': '<pre><code>const x = 1;</code></pre>',
	'code block (multiline)': '<pre><code>line 1\nline 2</code></pre>',
	'code block (with language)': '<pre><code class="language-js">const x = 1;</code></pre>',
	link: '<p><a href="https://directus.io">link</a></p>',
	'link with title': '<p><a href="https://directus.io" title="Home">link</a></p>',
	'link new tab': '<p><a href="https://directus.io" target="_blank" rel="noopener">link</a></p>',
	'hard break': '<p>line one<br>line two</p>',
	'font family (named)': '<p><span style="font-family: Arial, Helvetica, sans-serif;">text</span></p>',
	'font family (legacy keyword)': '<p><span style="font-family: serif;">text</span></p>',
	'font size (px)': '<p><span style="font-size: 24px;">text</span></p>',
	'font size (legacy pt)': '<p><span style="font-size: 18pt;">text</span></p>',
	'text color': '<p><span style="color: #ff0000;">text</span></p>',
	'background color': '<p><span style="background-color: #ffff00;">text</span></p>',
	'text align left': '<p style="text-align: left;">left</p>',
	'text align center': '<p style="text-align: center;">centered</p>',
	'text align right': '<p style="text-align: right;">right</p>',
	'text align justify': '<p style="text-align: justify;">justified</p>',
	'aligned heading': '<h2 style="text-align: center;">centered</h2>',
	video: '<video width="640" height="360" controls><source src="/assets/v.mp4" type="video/mp4"></video>',
	'audio with loop': '<audio loop controls><source src="/assets/a.mp3" type="audio/mpeg"></audio>',
	iframe: '<iframe src="about:blank" width="560" height="315"></iframe>',
	// persists as the legacy `<!-- pagebreak -->` comment via the page-break serialization boundary
	pagebreak: '<p>a</p><!-- pagebreak --><p>b</p>',
	'rtl paragraph': '<p dir="rtl">شسي</p>',
	'rtl heading': '<h2 dir="rtl">عنوان</h2>',
	'rtl list': '<ul dir="rtl"><li><p>عنصر</p></li></ul>',
	// table structure round-trips losslessly; column widths survive only as a cell `colwidth`,
	// legacy `<colgroup><col style="width…">` widths are normalized away (see snapshots)
	table: '<table><tbody><tr><td>a</td><td>b</td></tr><tr><td>c</td><td>d</td></tr></tbody></table>',
	'table with header row':
		'<table><tbody><tr><th>Name</th><th>Role</th></tr><tr><td>Ada</td><td>Engineer</td></tr></tbody></table>',
	'table with cell colwidth':
		'<table><tbody><tr><td colwidth="120"><p>a</p></td><td colwidth="240"><p>b</p></td></tr></tbody></table>',
	'table with legacy colgroup widths':
		'<table><colgroup><col style="width: 120px;"><col style="width: 240px;"></colgroup><tbody><tr><td>a</td><td>b</td></tr></tbody></table>',
};

describe('round-trip: faithful (StarterKit + TextStyleKit schema)', () => {
	test.each(Object.entries(FAITHFUL))('%s survives round-trip', (_name, html) => {
		expect(roundTrip(html)).toMatchSnapshot();
	});
});

/**
 * Non-schema semantic tags preserved by the semantic-html extensions. Exact-equality assertions
 * (not snapshots) so the preserved form, including which attributes survive, is explicit:
 * `details[open]`, `abbr[title]`. Other attributes (class/id/data-/aria-) are not yet preserved.
 */
const SEMANTIC: Record<string, string> = {
	section: '<section><p>text</p></section>',
	article: '<article><p>text</p></article>',
	'nested section in article': '<article><section><p>text</p></section></article>',
	'figure with figcaption': '<figure><img src="/assets/abc" alt="photo"><figcaption>A caption</figcaption></figure>',
	'figure with figcaption first':
		'<figure><figcaption>A caption</figcaption><img src="/assets/abc" alt="photo"></figure>',
	'details with summary': '<details><summary>More info</summary><p>Hidden content</p></details>',
	'details open': '<details open=""><summary>More info</summary><p>Visible content</p></details>',
	'description list':
		'<dl><dt>Term</dt><dd><p>Definition</p></dd><dt>Other term</dt><dd><p>Other definition</p></dd></dl>',
	mark: '<p>text with <mark>highlight</mark></p>',
	abbr: '<p><abbr title="HyperText Markup Language">HTML</abbr> is a language</p>',
	'abbr without title': '<p><abbr>HTML</abbr> is a language</p>',
};

describe('round-trip: semantic tags (preservation extensions)', () => {
	test.each(Object.entries(SEMANTIC))('%s survives round-trip unchanged', (_name, html) => {
		expect(roundTrip(html)).toBe(html);
	});

	test('details bare open attribute normalizes to open=""', () => {
		expect(roundTrip('<details open><summary>t</summary><p>c</p></details>')).toBe(
			'<details open=""><summary>t</summary><p>c</p></details>',
		);
	});

	test('dd plain text is wrapped in a paragraph', () => {
		expect(roundTrip('<dl><dt>Term</dt><dd>Definition</dd></dl>')).toBe(
			'<dl><dt>Term</dt><dd><p>Definition</p></dd></dl>',
		);
	});
});

/**
 * class, id, title, role, lang, dir, data-* and aria-* preserved on schema types by the
 * PreservedAttributes extension. Exact-equality: inputs are authored in serialized attribute order
 * (global attrs render before a type's own attrs, e.g. class before href).
 */
const PRESERVED_ATTRIBUTES: Record<string, string> = {
	'paragraph class': '<p class="intro">text</p>',
	'paragraph id': '<p id="lead">text</p>',
	'heading class and id': '<h2 class="section-title" id="part-1">text</h2>',
	'paragraph data attributes': '<p data-uid="42" data-context="hero">text</p>',
	'paragraph aria attributes': '<p aria-hidden="true">text</p>',
	'combined data and aria': '<p data-note="a" aria-label="Note">text</p>',
	'paragraph title': '<p title="Tooltip">text</p>',
	'span title only': '<p><span title="More info">text</span></p>',
	'span class before title': '<p><span class="fmt" title="Tip">text</span></p>',
	'paragraph role': '<p role="note">text</p>',
	'paragraph lang': '<p lang="fr">text</p>',
	'span role only': '<p><span role="note">text</span></p>',
	'span lang only': '<p><span lang="de">text</span></p>',
	'inline dir on span': '<p><span dir="rtl">نص</span></p>',
	'rtl paragraph with class': '<p dir="rtl" class="rtl-note">شسي</p>',
	'span class (unconfigured custom format)': '<p><span class="my-format">text</span></p>',
	'span id': '<p><span id="anchor-1">text</span></p>',
	'span data and aria': '<p><span data-tooltip="More" aria-label="Info">text</span></p>',
	'styled span keeps class': '<p><span style="color: #ff0000;" class="warning">text</span></p>',
	'bullet list with classes': '<ul class="checklist"><li class="done" data-step="1"><p>one</p></li></ul>',
	'ordered list class': '<ol class="steps"><li><p>first</p></li></ol>',
	'blockquote aria': '<blockquote aria-label="Quote"><p>quote</p></blockquote>',
	'code block class': '<pre class="line-numbers"><code>const x = 1;</code></pre>',
	'horizontal rule class': '<p>a</p><hr class="divider"><p>b</p>',
	'bold mark class': '<p><strong class="brand">bold</strong></p>',
	'italic mark data attribute': '<p><em data-emphasis="soft">italic</em></p>',
	'inline code class': '<p><code class="token">inline()</code></p>',
	'link class and data': '<p><a class="button" data-track="cta" href="https://directus.io">link</a></p>',
	'section class and data': '<section class="wrapper" data-module="faq"><p>text</p></section>',
	'figure class': '<figure class="media-left"><figcaption>A caption</figcaption></figure>',
	'details class': '<details class="faq-item" open=""><summary>t</summary><p>c</p></details>',
	'mark class': '<p>text with <mark class="hl-yellow">highlight</mark></p>',
	'abbr class before own title': '<p><abbr class="term" title="HyperText Markup Language">HTML</abbr> x</p>',
};

describe('round-trip: preserved attributes (class/id/title/role/lang/dir/data-*/aria-*)', () => {
	test.each(Object.entries(PRESERVED_ATTRIBUTES))('%s survives round-trip unchanged', (_name, html) => {
		expect(roundTrip(html)).toBe(html);
	});

	test('table and cell attributes are preserved', () => {
		const out = roundTrip(
			'<table class="pricing"><tbody><tr><td class="highlight" data-col="a"><p>a</p></td><td aria-selected="true"><p>b</p></td></tr></tbody></table>',
		);

		expect(out).toContain('class="pricing"');
		expect(out).toContain('class="highlight"');
		expect(out).toContain('data-col="a"');
		expect(out).toContain('aria-selected="true"');
	});

	test('video preserves class and data attributes', () => {
		const out = roundTrip(
			'<video class="player" data-media-id="v1" width="640" height="360" controls><source src="/assets/v.mp4" type="video/mp4"></video>',
		);

		expect(out).toContain('class="player"');
		expect(out).toContain('data-media-id="v1"');
		expect(out).toContain('src="/assets/v.mp4"');
	});

	test('iframe preserves class and aria attributes', () => {
		const out = roundTrip(
			'<iframe class="embed" aria-label="Map" src="about:blank" width="560" height="315"></iframe>',
		);

		expect(out).toContain('class="embed"');
		expect(out).toContain('aria-label="Map"');
		expect(out).toContain('src="about:blank"');
	});

	test('styled span keeps title', () => {
		const out = roundTrip('<p><span style="color: #ff0000;" title="Tip">text</span></p>');

		expect(out).toContain('title="Tip"');
		expect(out).toContain('color: #ff0000');
	});

	test('span keeps role, lang and dir alongside aria', () => {
		const out = roundTrip('<p><span aria-label="Note" role="note" lang="fr" dir="rtl">text</span></p>');

		expect(out).toContain('aria-label="Note"');
		expect(out).toContain('role="note"');
		expect(out).toContain('lang="fr"');
		expect(out).toContain('dir="rtl"');
	});

	test('block dir is not duplicated by the inline dir attribute', () => {
		expect(roundTrip('<p dir="rtl">نص</p>')).toBe('<p dir="rtl">نص</p>');
	});

	test('event-handler attributes are dropped', () => {
		expect(roundTrip('<p onclick="alert(1)" class="safe">text</p>')).toBe('<p class="safe">text</p>');
	});

	test('bare spans without preserved attributes are still unwrapped', () => {
		expect(roundTrip('<p><span>text</span></p>')).toBe('<p>text</p>');
	});

	test('empty class/id are not preserved (no churn)', () => {
		expect(roundTrip('<p class="" id="">text</p>')).toBe('<p>text</p>');
	});

	test('page breaks still encode to the legacy comment', () => {
		expect(roundTrip('<p>a</p><!-- pagebreak --><p>b</p>')).toBe('<p>a</p><!-- pagebreak --><p>b</p>');
	});
});

describe('round-trip: image', () => {
	test('preserves src with query params, alt, and loading="lazy"', () => {
		const out = roundTrip('<img src="/assets/abc?width=100&access_token=x" loading="lazy" alt="alt">');

		expect(out).toContain('<img');
		// `&` serializes to the HTML entity `&amp;` (browsers decode it back) — URL is preserved
		expect(out).toContain('src="/assets/abc?width=100&amp;access_token=x"');
		expect(out).toContain('alt="alt"');
		expect(out).toContain('loading="lazy"');
	});

	test('omits loading when not lazy', () => {
		const out = roundTrip('<img src="/assets/abc" alt="alt">');

		expect(out).toContain('<img');
		expect(out).not.toContain('loading');
	});

	test('preserves class, id, data-* and aria-* attributes', () => {
		const out = roundTrip(
			'<img src="/assets/abc" alt="a" class="hero" id="cover" data-lightbox="gallery" aria-describedby="caption">',
		);

		expect(out).toContain('class="hero"');
		expect(out).toContain('id="cover"');
		expect(out).toContain('data-lightbox="gallery"');
		expect(out).toContain('aria-describedby="caption"');
	});

	test('preserves explicit width/height attributes when present', () => {
		const out = roundTrip('<img src="/assets/abc" width="100" height="80" alt="alt">');

		expect(out).toContain('width="100"');
		expect(out).toContain('height="80"');
	});
});
