import { Editor } from '@tiptap/vue-3';
import { describe, expect, test } from 'vitest';
import { editorExtensions } from './extensions';

/**
 * HTML corpus round-trip tests.
 *
 * Tiptap parses HTML into a strict ProseMirror schema and re-serializes it; anything the
 * schema doesn't model is dropped or normalized. These tests feed representative HTML
 * (everything the legacy TinyMCE editor produced) through `setContent → getHTML` and snapshot
 * the result, so any change in round-trip fidelity shows up in review.
 *
 * Raw-HTML-passthrough decision (CMS-2635):
 *   No global raw-HTML passthrough — the editor's schema is the source of truth. Each construct
 *   the current schema can't represent is EITHER restored by a later extension issue OR a
 *   documented accepted regression. `LOSSY` below is the ledger of those cases; when an
 *   extension lands, its sample moves from LOSSY → FAITHFUL and the snapshot updates.
 *
 * The editor here uses the same extension set as input-rich-text-html.vue (see ./extensions).
 */
function roundTrip(html: string): string {
	const editor = new Editor({ extensions: editorExtensions, content: html });
	const out = editor.getHTML();
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
};

/**
 * Constructs the schema can't represent yet. Each is currently dropped/normalized; the comment
 * names the issue that will restore it (or marks it an accepted regression). Snapshots record the
 * actual lossy output; the assertions document precisely what is lost today.
 */
const LOSSY: Array<{ name: string; html: string; absent: string; issue: string }> = [
	{
		name: 'table',
		html: '<table><tbody><tr><td>a</td><td>b</td></tr></tbody></table>',
		absent: '<table',
		issue: 'CMS-2639',
	},
	{
		name: 'video',
		html: '<video controls><source src="/v.mp4" type="video/mp4"></video>',
		absent: '<video',
		issue: 'CMS-2643',
	},
	{
		name: 'audio',
		html: '<audio controls><source src="/a.mp3" type="audio/mpeg"></audio>',
		absent: '<audio',
		issue: 'CMS-2643',
	},
	{ name: 'iframe', html: '<iframe src="about:blank"></iframe>', absent: '<iframe', issue: 'CMS-2643' },
	{ name: 'rtl direction', html: '<p dir="rtl">شسي</p>', absent: 'dir=', issue: 'CMS-2646' },
	{ name: 'pagebreak', html: '<p>a</p><!-- pagebreak --><p>b</p>', absent: 'pagebreak', issue: 'CMS-2647' },
	{
		name: 'custom format span',
		html: '<p><span class="my-format">text</span></p>',
		absent: 'my-format',
		issue: 'CMS-2648',
	},
];

describe('round-trip: faithful (StarterKit + TextStyleKit schema)', () => {
	test.each(Object.entries(FAITHFUL))('%s survives round-trip', (_name, html) => {
		expect(roundTrip(html)).toMatchSnapshot();
	});
});

describe('round-trip: image (CMS-2641)', () => {
	test('preserves src with query params, alt, and loading="lazy"', () => {
		const out = roundTrip('<img src="/assets/abc?width=100&access_token=x" loading="lazy" alt="alt">');

		expect(out).toContain('<img');
		// `&` serializes to the HTML entity `&amp;` (browsers decode it back) — URL is preserved.
		expect(out).toContain('src="/assets/abc?width=100&amp;access_token=x"');
		expect(out).toContain('alt="alt"');
		expect(out).toContain('loading="lazy"');
	});

	test('omits loading when not lazy', () => {
		const out = roundTrip('<img src="/assets/abc" alt="alt">');

		expect(out).toContain('<img');
		expect(out).not.toContain('loading');
	});

	test('preserves explicit width/height attributes when present', () => {
		const out = roundTrip('<img src="/assets/abc" width="100" height="80" alt="alt">');

		expect(out).toContain('width="100"');
		expect(out).toContain('height="80"');
	});
});

describe('round-trip: lossy (restored by later issues / accepted regression)', () => {
	test.each(LOSSY)('$name is dropped today (→ $issue)', ({ html, absent }) => {
		const out = roundTrip(html);
		expect(out).not.toContain(absent);
		expect(out).toMatchSnapshot();
	});
});
