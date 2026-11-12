import { isAllowedUri } from '@tiptap/extension-link';
import DOMPurify, { type UponSanitizeAttributeHook } from 'dompurify';

export interface RawHtmlSanitizeOptions {
	keepInlineStyles: boolean;
	linkProtocols: string[];
}

const purify = DOMPurify(window);

const FORM_ATTRIBUTES = ['accept-charset', 'formaction', 'formenctype', 'formmethod', 'formnovalidate', 'formtarget'];

const LINK_TAGS = new Set(['a', 'area']);
const HREF_ATTRIBUTES = new Set(['href', 'xlink:href']);

function hrefHook(linkProtocols: string[]): UponSanitizeAttributeHook {
	return (node, data) => {
		if (!HREF_ATTRIBUTES.has(data.attrName)) return;

		const tag = node.nodeName.toLowerCase();
		if (tag !== 'use' && !LINK_TAGS.has(tag)) return;

		// a fragment-only href can only point at an element already in the page, never load a file
		const allowed = tag === 'use' ? data.attrValue.startsWith('#') : isAllowedUri(data.attrValue, linkProtocols);

		if (allowed) data.forceKeepAttr = true;
		else data.keepAttr = false;
	};
}

// a <template> keeps the parsed HTML inert: no scripts run and no resources load
export function htmlToElement(html: string): Element | null {
	const template = document.createElement('template');
	template.innerHTML = html;
	return template.content.firstElementChild;
}

export function sanitizeRawHtml(html: string, options: RawHtmlSanitizeOptions): string {
	if (!purify.isSupported) return '';

	const hook = hrefHook(options.linkProtocols);
	purify.addHook('uponSanitizeAttribute', hook);

	try {
		const clean = purify.sanitize(html, {
			USE_PROFILES: { html: true, svg: true, svgFilters: true },
			ADD_TAGS: ['use'],
			// DOMPurify drops a javascript: URI in any allowed attribute, so `formaction` is safe to add
			ADD_ATTR: ['focusable', 'target', ...FORM_ATTRIBUTES],
			...(options.keepInlineStyles ? {} : { FORBID_TAGS: ['style'], FORBID_ATTR: ['style'] }),
		});

		return htmlToElement(clean)?.outerHTML ?? '';
	} finally {
		purify.removeHook('uponSanitizeAttribute', hook);
	}
}
