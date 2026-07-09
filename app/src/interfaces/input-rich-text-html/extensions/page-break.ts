import { Node } from '@tiptap/vue-3';

// Page breaks are persisted as TinyMCE's `<!-- pagebreak -->` comment, which ProseMirror's DOM
// parser discards, so the editor models an element node instead. `decodePageBreaks`/`encodePageBreaks`
// swap between the two at the value boundary (input-rich-text-html.vue).
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

export const PAGE_BREAK_NODE = 'pageBreak';

const PAGE_BREAK_MARKER = '<!-- pagebreak -->';

const MARKER_RE = /<!--\s*pagebreak\s*-->/g;

const ELEMENT_RE = /<div\b[^>]*\bdata-page-break\b[^>]*><\/div>/g;

export function decodePageBreaks(html: string): string {
	return html.replace(MARKER_RE, '<div data-page-break></div>');
}

export function encodePageBreaks(html: string): string {
	return html.replace(ELEMENT_RE, PAGE_BREAK_MARKER);
}
