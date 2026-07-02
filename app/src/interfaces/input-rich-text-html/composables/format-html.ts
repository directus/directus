/**
 * Pretty-prints editor HTML for the source-code drawer. Indentation wraps only block-level
 * elements; inline content and `<pre>` stay verbatim, so no significant whitespace is added and
 * the result re-parses to the same document (see format-html.test.ts).
 */

const INDENT = '  ';

const BLOCK_TAGS = new Set([
	'address',
	'article',
	'aside',
	'blockquote',
	'div',
	'figcaption',
	'figure',
	'footer',
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6',
	'header',
	'hr',
	'img',
	'li',
	'ol',
	'p',
	'section',
	'table',
	'tbody',
	'td',
	'tfoot',
	'th',
	'thead',
	'tr',
	'ul',
]);

const VOID_TAGS = new Set(['hr', 'img', 'br']);

// Whitespace-significant: emit the whole element verbatim, never reformat its contents.
const PRESERVE_TAGS = new Set(['pre']);

function isBlock(node: Node): node is HTMLElement {
	return node.nodeType === Node.ELEMENT_NODE && BLOCK_TAGS.has((node as HTMLElement).tagName.toLowerCase());
}

function hasBlockChild(el: HTMLElement): boolean {
	return Array.from(el.childNodes).some(isBlock);
}

// Open tag with attributes, serialized by the DOM so attribute escaping is always correct.
function openTag(el: HTMLElement): string {
	const tag = el.tagName.toLowerCase();
	const shallow = el.cloneNode(false) as HTMLElement;
	const html = shallow.outerHTML;
	if (VOID_TAGS.has(tag)) return html;
	return html.slice(0, html.length - `</${tag}>`.length);
}

function serialize(nodes: NodeListOf<ChildNode> | ChildNode[], depth: number): string {
	const pad = INDENT.repeat(depth);
	const lines: string[] = [];

	for (const node of Array.from(nodes)) {
		if (isBlock(node)) {
			const el = node;
			const tag = el.tagName.toLowerCase();

			if (VOID_TAGS.has(tag)) {
				lines.push(pad + openTag(el));
			} else if (PRESERVE_TAGS.has(tag) || !hasBlockChild(el)) {
				// inline-only (or whitespace-significant) block: keep its contents on one line
				lines.push(pad + el.outerHTML);
			} else {
				lines.push(pad + openTag(el));
				lines.push(serialize(el.childNodes, depth + 1));
				lines.push(pad + `</${tag}>`);
			}

			continue;
		}

		// text / inline element: skip whitespace-only text between blocks, emit the rest verbatim
		const html = node.nodeType === Node.TEXT_NODE ? (node.textContent ?? '') : (node as HTMLElement).outerHTML;
		if (html.trim()) lines.push(pad + html.trim());
	}

	return lines.filter(Boolean).join('\n');
}

export function formatHtml(html: string): string {
	const doc = new DOMParser().parseFromString(html, 'text/html');
	return serialize(doc.body.childNodes, 0);
}
