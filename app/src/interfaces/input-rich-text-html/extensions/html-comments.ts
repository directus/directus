import { type AnyExtension, type Editor, Extension, Node } from '@tiptap/core';
import { joinBackward, joinForward } from '@tiptap/pm/commands';
import {
	type ParseOptions,
	DOMParser as ProseMirrorDOMParser,
	type Node as ProseMirrorNode,
	type Slice,
} from '@tiptap/pm/model';
import { type EditorState, Plugin, Selection, TextSelection, type Transaction } from '@tiptap/pm/state';
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

function commentsIn(root: globalThis.Node, keep: (text: string) => boolean): Comment[] {
	const document = root.ownerDocument ?? (root as Document);
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT);
	const comments: Comment[] = [];

	while (walker.nextNode()) {
		const comment = walker.currentNode as Comment;
		if (!comment.parentElement?.closest(RAW_HTML_SELECTOR) && keep(comment.data)) comments.push(comment);
	}

	return comments;
}

// ProseMirror's parser skips comment nodes and no parse rule can match them, so they become elements first
function withPlaceholders(dom: globalThis.Node, keep: (text: string) => boolean): globalThis.Node {
	const copy = dom.cloneNode(true);
	const comments = commentsIn(copy, keep);
	if (comments.length === 0) return dom;

	for (const comment of comments) {
		const placeholder = comment.ownerDocument.createElement(PLACEHOLDER_TAG);
		placeholder.setAttribute(TEXT_ATTRIBUTE, comment.data);
		comment.replaceWith(placeholder);
	}

	return copy;
}

class HtmlCommentParser extends ProseMirrorDOMParser {
	copiedComments: ReadonlySet<string> = new Set();

	override parse(dom: globalThis.Node, options?: ParseOptions) {
		return super.parse(
			withPlaceholders(dom, () => true),
			options,
		);
	}

	// a pasted comment could hide an SSI or ESI directive, so paste keeps only comments this editor copied
	override parseSlice(dom: globalThis.Node, options?: ParseOptions) {
		return super.parseSlice(
			withPlaceholders(dom, (text) => this.copiedComments.has(text)),
			options,
		);
	}
}

function commentTexts(slice: Slice): Set<string> {
	const texts = new Set<string>();

	slice.content.descendants((node) => {
		if (isComment(node)) texts.add(node.attrs[TEXT_ATTRIBUTE]);
	});

	return texts;
}

// ProseMirror's renderSpec accepts only elements, so `renderHTML` writes a placeholder that this swaps back
const restoreComments: SerializerHook = (dom) => {
	for (const placeholder of Array.from(dom.querySelectorAll(PLACEHOLDER_TAG))) {
		placeholder.replaceWith(placeholder.ownerDocument.createComment(placeholder.getAttribute(TEXT_ATTRIBUTE) ?? ''));
	}
};

function commentNode(name: string, placementType: 'block' | 'inline', tag: 'div' | 'span') {
	return Node.create({
		name,
		group: placementType,
		inline: placementType === 'inline',
		atom: true,
		// a hidden comment must not be selected, or typing would replace it
		selectable: false,

		addAttributes() {
			return {
				[TEXT_ATTRIBUTE]: {
					default: '',
					parseHTML: (element: HTMLElement) => element.getAttribute(TEXT_ATTRIBUTE) ?? '',
					rendered: false,
				},
			};
		},

		parseHTML() {
			return [{ tag: PLACEHOLDER_TAG, getAttrs: (element) => (placement(element) === placementType ? null : false) }];
		},

		renderHTML({ node }) {
			return [PLACEHOLDER_TAG, { [TEXT_ATTRIBUTE]: node.attrs[TEXT_ATTRIBUTE] }];
		},

		addNodeView() {
			return ({ node }) => {
				const dom = document.createElement(tag);
				const text = String(node.attrs[TEXT_ATTRIBUTE]);
				dom.className = 'html-comment';
				dom.contentEditable = 'false';
				dom.title = text;
				dom.textContent = `<!--${text}-->`;
				return { dom };
			};
		},
	});
}

export const HtmlCommentBlock = commentNode('htmlCommentBlock', 'block', 'div');
export const HtmlCommentInline = commentNode('htmlCommentInline', 'inline', 'span');

function isComment(node: ProseMirrorNode | null | undefined): boolean {
	return node?.type.name === HtmlCommentBlock.name || node?.type.name === HtmlCommentInline.name;
}

type Direction = -1 | 1;

function charSize(text: string, dir: Direction): number {
	const code = dir < 0 ? text.charCodeAt(text.length - 1) : text.charCodeAt(0);
	const isSurrogate = dir < 0 ? code >= 0xdc00 && code <= 0xdfff : code >= 0xd800 && code <= 0xdbff;
	return isSurrogate && text.length > 1 ? 2 : 1;
}

function join(state: EditorState, dir: Direction): Transaction | null {
	let result: Transaction | null = null;
	// no view: `endOfTextblock` would read a DOM that does not show the comments moved in `state` yet
	(dir < 0 ? joinBackward : joinForward)(state, (tr) => (result = tr));
	return result;
}

/**
 * Comments can be hidden, so Backspace and Delete step over them instead of removing one the user
 * cannot see. `false` leaves the key to the default handlers, `null` swallows it.
 */
function deleteAcrossComments(state: EditorState, dir: Direction): Transaction | null | false {
	const { selection } = state;
	if (!selection.empty || !(selection instanceof TextSelection)) return false;

	const $pos = selection.$from;
	const parent = $pos.parent;

	if (isComment(dir < 0 ? $pos.nodeBefore : $pos.nodeAfter)) {
		let index = dir < 0 ? $pos.index() - 1 : $pos.index();
		let pos = $pos.pos;

		while (index >= 0 && index < parent.childCount && isComment(parent.child(index))) {
			pos += dir * parent.child(index).nodeSize;
			index += dir;
		}

		if (index < 0 || index >= parent.childCount) {
			const atEdge = state.apply(state.tr.setSelection(TextSelection.create(state.doc, pos)));
			const result = deleteAcrossComments(atEdge, dir);
			return result === false ? join(atEdge, dir) : result;
		}

		const target = parent.child(index);
		const size = target.isText ? charSize(target.text!, dir) : target.nodeSize;
		return dir < 0 ? state.tr.delete(pos - size, pos) : state.tr.delete(pos, pos + size);
	}

	const atEdge = dir < 0 ? $pos.parentOffset === 0 : $pos.parentOffset === parent.content.size;
	if (!atEdge || $pos.depth === 0) return false;

	const container = $pos.node(-1);
	let index = $pos.index(-1) + dir;
	let size = 0;

	while (index >= 0 && index < container.childCount && isComment(container.child(index))) {
		size += container.child(index).nodeSize;
		index += dir;
	}

	if (size === 0) return false;

	// the comments move to the far side of this block, so the join treats them as absent
	const blockStart = $pos.before();
	const blockEnd = $pos.after();
	const tr = state.tr;

	if (dir < 0) {
		tr.insert(blockEnd, state.doc.slice(blockStart - size, blockStart).content);
		tr.delete(blockStart - size, blockStart);
		tr.setSelection(TextSelection.create(tr.doc, $pos.pos - size));
	} else {
		tr.delete(blockEnd, blockEnd + size);
		tr.insert(blockStart, state.doc.slice(blockEnd, blockEnd + size).content);
		tr.setSelection(TextSelection.create(tr.doc, $pos.pos + size));
	}

	const joined = join(state.apply(tr), dir);
	if (!joined) return null;

	for (const step of joined.steps) tr.step(step);
	return tr.setSelection(Selection.fromJSON(tr.doc, joined.selection.toJSON()));
}

function handleDeleteKey(editor: Editor, dir: Direction): boolean {
	const result = deleteAcrossComments(editor.state, dir);
	if (result === false) return false;
	if (result) editor.view.dispatch(result.scrollIntoView());
	return true;
}

/** Keeps HTML comments from stored content as hidden atoms (field option `keepHtmlComments`). */
export const HtmlComments = Extension.create({
	name: 'htmlComments',
	priority: 1000,

	addExtensions() {
		return [HtmlCommentBlock, HtmlCommentInline];
	},

	addKeyboardShortcuts() {
		return {
			Backspace: ({ editor }) => handleDeleteKey(editor, -1),
			Delete: ({ editor }) => handleDeleteKey(editor, 1),
		};
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				props: {
					transformCopied: (slice, view) => {
						const parser = ProseMirrorDOMParser.fromSchema(view.state.schema);
						if (parser instanceof HtmlCommentParser) parser.copiedComments = commentTexts(slice);
						return slice;
					},
				},
			}),
		];
	},

	onBeforeCreate() {
		const { schema } = this.editor;
		schema.cached['domParser'] = new HtmlCommentParser(schema, ProseMirrorDOMParser.fromSchema(schema).rules);
		addSerializerHook(schema, restoreComments);
	},
});

export function buildHtmlCommentSchema(keep: unknown): { extensions: AnyExtension[]; key: string } {
	if (keep !== true) return { extensions: [], key: '' };

	return { extensions: [HtmlComments], key: 'html-comments' };
}
