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

// ASCII whitespace HTML collapses at a textblock boundary; excludes &nbsp; / Unicode spaces, which
// are significant and survive normalization.
const LEADING_WS = /^[ \t\n\r\f]+/;
const TRAILING_WS = /[ \t\n\r\f]+$/;

function firstTextNode(el: Node): Text | null {
	for (const child of Array.from(el.childNodes)) {
		if (child.nodeType === Node.TEXT_NODE) return child as Text;
		const nested = firstTextNode(child);
		if (nested) return nested;
	}

	return null;
}

function lastTextNode(el: Node): Text | null {
	for (const child of Array.from(el.childNodes).reverse()) {
		if (child.nodeType === Node.TEXT_NODE) return child as Text;
		const nested = lastTextNode(child);
		if (nested) return nested;
	}

	return null;
}

// Drop the leading/trailing whitespace Tiptap trims at a textblock boundary (possibly nested inside
// inline marks) so an otherwise-identical document doesn't read as changed.
function trimBoundaryWhitespace(el: HTMLElement): void {
	const first = firstTextNode(el);
	if (first) first.textContent = (first.textContent ?? '').replace(LEADING_WS, '');
	const last = lastTextNode(el);
	if (last) last.textContent = (last.textContent ?? '').replace(TRAILING_WS, '');
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
			} else if (PRESERVE_TAGS.has(tag)) {
				// whitespace-significant block (<pre>): emit verbatim
				lines.push(pad + el.outerHTML);
			} else if (!hasBlockChild(el)) {
				// inline-only block: keep its contents on one line, minus boundary whitespace
				trimBoundaryWhitespace(el);
				lines.push(pad + el.outerHTML);
			} else {
				lines.push(pad + openTag(el));
				lines.push(serialize(el.childNodes, depth + 1));
				lines.push(pad + `</${tag}>`);
			}

			continue;
		}

		// text / comment / inline element: skip whitespace-only text between blocks, emit the rest verbatim
		let html: string;

		if (node.nodeType === Node.TEXT_NODE) {
			html = node.textContent ?? '';
		} else if (node.nodeType === Node.COMMENT_NODE) {
			html = `<!--${(node as Comment).data}-->`;
		} else {
			html = (node as HTMLElement).outerHTML ?? '';
		}

		if (html.trim()) lines.push(pad + html.trim());
	}

	return lines.filter(Boolean).join('\n');
}

export function formatHtml(html: string): string {
	const root = document.createElement('div');
	root.innerHTML = html;
	return serialize(root.childNodes, 0);
}
