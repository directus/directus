import { Node } from '@tiptap/vue-3';

/**
 * Page break — parity with TinyMCE's `pagebreak` plugin.
 *
 * TinyMCE serialized page breaks as the HTML comment `<!-- pagebreak -->`. ProseMirror's DOM parser
 * discards comment nodes, so the node can't parse that marker directly. We mirror TinyMCE's own
 * split: an *element* lives inside the editor (a non-editable atom that ProseMirror can model and
 * select), and the comment is the *persisted* form. `decodePageBreaks`/`encodePageBreaks` convert
 * between the two at the value boundary (see input-rich-text-html.vue); the round-trip tests apply
 * the same boundary so the stored `<!-- pagebreak -->` survives unchanged.
 */
export const PageBreak = Node.create({
	name: 'pageBreak',
	group: 'block',
	atom: true,
	selectable: true,

	parseHTML() {
		return [{ tag: 'div[data-page-break]' }];
	},

	renderHTML() {
		return ['div', { 'data-page-break': 'true', class: 'page-break', contenteditable: 'false' }];
	},
});

/** Inserted by the toolbar button via `insertContent` — the node name to add to the document. */
export const PAGE_BREAK_NODE = 'pageBreak';

/** Persisted page-break marker — byte-identical to TinyMCE's default `pagebreak_separator`. */
const PAGE_BREAK_MARKER = '<!-- pagebreak -->';

// Tolerant of whitespace inside the comment (`<!--pagebreak-->`, `<!--  pagebreak  -->`).
const MARKER_RE = /<!--\s*pagebreak\s*-->/g;

// The element `renderHTML` emits; matched loosely so attribute order/spacing don't matter.
const ELEMENT_RE = /<div\b[^>]*\bdata-page-break\b[^>]*><\/div>/g;

/** Stored comment marker → editor element, so ProseMirror can parse it into a `pageBreak` node. */
export function decodePageBreaks(html: string): string {
	return html.replace(MARKER_RE, '<div data-page-break></div>');
}

/** Editor element (from `getHTML`) → stored comment marker, restoring the legacy serialization. */
export function encodePageBreaks(html: string): string {
	return html.replace(ELEMENT_RE, PAGE_BREAK_MARKER);
}
