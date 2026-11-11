import type { DOMOutputSpec } from '@tiptap/pm/model';
import { Node } from '@tiptap/vue-3';
import { type RawHtmlSanitizeOptions, sanitizeRawHtml } from './raw-html-sanitize';

export interface RawHtmlElement {
	tag: string;
	placement: 'block' | 'auto';
}

export interface RawHtmlOptions extends RawHtmlSanitizeOptions {
	elements: RawHtmlElement[];
}

export const DEFAULT_RAW_HTML_ELEMENTS: RawHtmlElement[] = [
	{ tag: 'svg', placement: 'auto' },
	{ tag: 'map', placement: 'block' },
];

const PHRASING =
	'a, abbr, b, bdi, bdo, cite, code, del, dfn, em, i, ins, kbd, label, mark, q, s, samp, small, span, strong, sub, sup, time, u, var';

const TEXT_BLOCKS = 'p, h1, h2, h3, h4, h5, h6, pre, figcaption, caption, li';

const INLINE_SIBLINGS = `${PHRASING}, img, br`;

/** Whether an element sits among inline content, so it must parse as an inline node to keep its marks. */
export function isInlineContext(element: Element): boolean {
	for (
		let ancestor = element.parentElement;
		ancestor && ancestor.localName !== 'body';
		ancestor = ancestor.parentElement
	) {
		if (ancestor.matches(PHRASING)) return true;
	}

	if (element.parentElement?.matches(TEXT_BLOCKS)) return true;

	return Array.from(element.parentNode?.childNodes ?? []).some((sibling) => {
		if (sibling === element) return false;
		if (sibling.nodeType === 3) return Boolean(sibling.textContent?.trim());
		return sibling.nodeType === 1 && (sibling as Element).matches(INLINE_SIBLINGS);
	});
}

/** Parses stored HTML into a detached element; a `<template>` keeps it inert (no scripts, no loads). */
export function htmlToElement(html: string): Element | null {
	const template = document.createElement('template');
	template.innerHTML = html;
	return template.content.firstElementChild;
}

function rawHtmlNode(name: string, inline: boolean) {
	return Node.create<RawHtmlOptions>({
		name,
		group: inline ? 'inline' : 'block',
		inline,
		atom: true,
		selectable: true,

		addOptions() {
			return { elements: DEFAULT_RAW_HTML_ELEMENTS, keepInlineStyles: false, linkProtocols: [] };
		},

		addAttributes() {
			return {
				html: {
					default: '',
					rendered: false,
					// without its own parseHTML, Tiptap would read a DOM attribute named `html` over the sanitized value
					parseHTML: (element) => sanitizeRawHtml(element.outerHTML, this.options),
				},
			};
		},

		parseHTML() {
			return this.options.elements
				.filter(({ placement }) => !inline || placement === 'auto')
				.map(({ tag, placement }) => ({
					tag,
					getAttrs: (element: HTMLElement) => {
						if (placement === 'auto' && isInlineContext(element) !== inline) return false;
						return {};
					},
				}));
		},

		renderHTML({ node }): DOMOutputSpec {
			// the empty text node makes a removed element disappear, so the diff shows the warning
			return htmlToElement(node.attrs['html']) ?? (document.createTextNode('') as unknown as DOMOutputSpec);
		},

		addNodeView() {
			return ({ node }) => {
				const dom = document.createElement(inline ? 'span' : 'div');
				dom.className = 'raw-html';
				dom.setAttribute('contenteditable', 'false');
				dom.dataset['rawHtml'] = htmlToElement(node.attrs['html'])?.localName ?? '';
				return { dom };
			};
		},
	});
}

/** An element the schema cannot model (`<svg>`, `<map>`), kept as sanitized HTML and shown as a chip. */
export const RawHtmlBlock = rawHtmlNode('rawHtmlBlock', false);

/** The inline variant of `RawHtmlBlock`, for an element among text, so marks such as Link reach it. */
export const RawHtmlInline = rawHtmlNode('rawHtmlInline', true);

export const RAW_HTML_NODE_NAMES: ReadonlySet<string> = new Set([RawHtmlBlock.name, RawHtmlInline.name]);
