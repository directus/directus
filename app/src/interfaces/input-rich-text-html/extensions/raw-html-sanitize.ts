import { isAllowedUri } from '@tiptap/extension-link';
import DOMPurify from 'dompurify';

export interface RawHtmlSanitizeOptions {
	keepInlineStyles: boolean;
	linkProtocols: string[];
}

const purify = DOMPurify(window);

let currentLinkProtocols: string[] = [];

purify.addHook('uponSanitizeAttribute', (node, data) => {
	const tag = node.nodeName.toLowerCase();
	if ((tag !== 'a' && tag !== 'area') || (data.attrName !== 'href' && data.attrName !== 'xlink:href')) return;

	if (isAllowedUri(data.attrValue, currentLinkProtocols)) {
		data.forceKeepAttr = true;
	} else {
		data.keepAttr = false;
	}
});

export function sanitizeRawHtml(html: string, options: RawHtmlSanitizeOptions): string {
	currentLinkProtocols = options.linkProtocols;

	if (!purify.isSupported) return '';

	const template = document.createElement('template');

	const clean = purify.sanitize(html, {
		USE_PROFILES: { html: true, svg: true, svgFilters: true },
		ADD_ATTR: ['focusable', 'target'],
		...(options.keepInlineStyles ? {} : { FORBID_TAGS: ['style'], FORBID_ATTR: ['style'] }),
	});

	template.innerHTML = clean;

	return template.content.firstElementChild?.outerHTML ?? '';
}
