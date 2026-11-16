import { Extension, Node } from '@tiptap/core';
import { type ParseOptions, DOMParser as ProseMirrorDOMParser } from '@tiptap/pm/model';
import { FORM_TAGS, RAW_HTML_TAGS } from './raw-html';
import { addSerializerHook, type SerializerHook } from './serializer-hooks';

const PLACEHOLDER_TAG = 'directus-html-comment';
const TEXT_ATTRIBUTE = 'text';

// raw HTML nodes store their outerHTML, so a comment inside them is already kept
const RAW_HTML_SELECTOR = [...RAW_HTML_TAGS, ...FORM_TAGS].join(', ');

// the schema allows no block here, so a block comment would split the list or table
const STRUCTURAL_PARENTS = new Set(['UL', 'OL', 'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'COLGROUP', 'DL']);

const BLOCK_PARENTS = new Set([
	'BODY',
	'DIV',
	'SECTION',
	'ARTICLE',
	'ASIDE',
	'HEADER',
	'FOOTER',
	'NAV',
	'MAIN',
	'BLOCKQUOTE',
	'LI',
	'TD',
	'TH',
	'FIGURE',
	'DETAILS',
]);

const BLOCK_ELEMENTS = new Set([
	...BLOCK_PARENTS,
	...STRUCTURAL_PARENTS,
	'P',
	'H1',
	'H2',
	'H3',
	'H4',
	'H5',
	'H6',
	'PRE',
	'HR',
	'FIGCAPTION',
	'SUMMARY',
	'IMG',
	'VIDEO',
	'AUDIO',
	'IFRAME',
	'STYLE',
	PLACEHOLDER_TAG.toUpperCase(),
]);

type Placement = 'block' | 'inline' | null;

function placement(element: HTMLElement): Placement {
	const parent = element.parentElement;
	// a code block holds plain text only, so an atom would split it
	if (!parent || STRUCTURAL_PARENTS.has(parent.nodeName) || element.closest('pre')) return null;
	if (!BLOCK_PARENTS.has(parent.nodeName)) return 'inline';

	const inlineSibling = Array.from(parent.childNodes).some((sibling) => {
		if (sibling.nodeType === 3) return Boolean(sibling.textContent?.trim());
		return sibling.nodeType === 1 && !BLOCK_ELEMENTS.has(sibling.nodeName);
	});

	if (inlineSibling) return 'inline';
	// a list item must start with a paragraph, so a leading block would move out of the list
	if (parent.nodeName === 'LI' && !element.previousElementSibling) return null;
	return 'block';
}

function commentsIn(root: globalThis.Node): Comment[] {
	const document = root.ownerDocument ?? (root as Document);
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
	const comments: Comment[] = [];

	while (walker.nextNode()) {
		const comment = walker.currentNode as Comment;
		if (!comment.parentElement?.closest(RAW_HTML_SELECTOR)) comments.push(comment);
	}

	return comments;
}

// ProseMirror's parser skips comment nodes and no parse rule can match them, so they become elements first
function withPlaceholders(dom: globalThis.Node): globalThis.Node {
	if (commentsIn(dom).length === 0) return dom;

	const copy = dom.cloneNode(true);

	for (const comment of commentsIn(copy)) {
		const placeholder = comment.ownerDocument.createElement(PLACEHOLDER_TAG);
		placeholder.setAttribute(TEXT_ATTRIBUTE, comment.data);
		comment.replaceWith(placeholder);
	}

	return copy;
}

// paste and drop use `parseSlice`, which still drops comments: a pasted one could hide an SSI or ESI directive
class HtmlCommentParser extends ProseMirrorDOMParser {
	override parse(dom: globalThis.Node, options?: ParseOptions) {
		return super.parse(withPlaceholders(dom), options);
	}
}

// ProseMirror's renderSpec accepts only elements, so `renderHTML` writes a placeholder that this swaps back
const restoreComments: SerializerHook = (dom) => {
	for (const placeholder of Array.from(dom.querySelectorAll(PLACEHOLDER_TAG))) {
		placeholder.replaceWith(placeholder.ownerDocument.createComment(placeholder.getAttribute(TEXT_ATTRIBUTE) ?? ''));
	}
};

function commentNodeView(tag: 'div' | 'span') {
	return ({ node }: { node: { attrs: Record<string, unknown> } }) => {
		const dom = document.createElement(tag);
		const text = String(node.attrs['text']);
		dom.className = 'html-comment';
		dom.contentEditable = 'false';
		dom.title = text;
		dom.textContent = `<!--${text}-->`;
		return { dom };
	};
}

const commentAttributes = {
	text: {
		default: '',
		parseHTML: (element: HTMLElement) => element.getAttribute(TEXT_ATTRIBUTE) ?? '',
		rendered: false,
	},
};

export const HtmlCommentBlock = Node.create({
	name: 'htmlCommentBlock',
	group: 'block',
	atom: true,
	selectable: true,

	addAttributes() {
		return commentAttributes;
	},

	parseHTML() {
		return [{ tag: PLACEHOLDER_TAG, getAttrs: (element) => (placement(element) === 'block' ? null : false) }];
	},

	renderHTML({ node }) {
		return [PLACEHOLDER_TAG, { [TEXT_ATTRIBUTE]: node.attrs['text'] }];
	},

	addNodeView() {
		return commentNodeView('div');
	},
});

export const HtmlCommentInline = Node.create({
	name: 'htmlCommentInline',
	group: 'inline',
	inline: true,
	atom: true,
	selectable: true,

	addAttributes() {
		return commentAttributes;
	},

	parseHTML() {
		return [{ tag: PLACEHOLDER_TAG, getAttrs: (element) => (placement(element) === 'inline' ? null : false) }];
	},

	renderHTML({ node }) {
		return [PLACEHOLDER_TAG, { [TEXT_ATTRIBUTE]: node.attrs['text'] }];
	},

	addNodeView() {
		return commentNodeView('span');
	},
});

/** Keeps HTML comments from stored content as hidden atoms (field option `keepHtmlComments`). */
export const HtmlComments = Extension.create({
	name: 'htmlComments',

	addExtensions() {
		return [HtmlCommentBlock, HtmlCommentInline];
	},

	onBeforeCreate() {
		const { schema } = this.editor;
		schema.cached['domParser'] = new HtmlCommentParser(schema, ProseMirrorDOMParser.fromSchema(schema).rules);
		addSerializerHook(schema, restoreComments);
	},
});

export function buildHtmlCommentSchema(keep: unknown): { extensions: Extension[]; key: string } {
	if (keep !== true) return { extensions: [], key: '' };

	return { extensions: [HtmlComments], key: 'html-comments' };
}
