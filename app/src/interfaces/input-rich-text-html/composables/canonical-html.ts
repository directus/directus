import { FORM_TAGS, RAW_HTML_TAGS } from '../extensions/raw-html';

export function parseBody(html: string): HTMLElement {
	return new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
}

// a re-parse renders preserved global attributes before a node's own, so attribute order is not stable
export function sortAttributes(html: string): string {
	const root = parseBody(html);
	sortElementAttributes(root);
	return root.innerHTML;
}

function sortElementAttributes(root: HTMLElement): void {
	for (const el of root.querySelectorAll('*')) {
		const attributes = Array.from(el.attributes, ({ name, value }) => [name, value] as const);
		for (const [name] of attributes) el.removeAttribute(name);

		for (const [name, value] of attributes.sort(([a], [b]) => (a < b ? -1 : 1))) {
			el.setAttribute(name, value);
		}
	}
}

// the same test Tiptap's elementFromString uses to drop whitespace text nodes before parsing
const DROPPED_WHITESPACE = /^(\n\s\s|\n)$/;

const RAW_HTML_SELECTOR = [...RAW_HTML_TAGS, ...FORM_TAGS].join(', ');

// only inside elements a raw HTML node can keep: elsewhere such a newline can be the only gap between two words
export function removeDroppedWhitespace(roots: Iterable<Element>): void {
	for (const el of roots) {
		const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
		const dropped: Node[] = [];

		while (walker.nextNode()) {
			if (DROPPED_WHITESPACE.test(walker.currentNode.textContent ?? '')) dropped.push(walker.currentNode);
		}

		for (const node of dropped) node.parentNode?.removeChild(node);
	}
}

export function canonicalHtml(html: string): string {
	const root = parseBody(html);
	removeDroppedWhitespace(root.querySelectorAll(RAW_HTML_SELECTOR));
	sortElementAttributes(root);
	return root.innerHTML;
}
