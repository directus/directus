import { type AnyExtension, Node } from '@tiptap/vue-3';

/** Wrapper elements a field can opt into keeping. `section` and `article` are always kept (semantic-html.ts). */
export const WRAPPER_ELEMENTS = ['div', 'aside', 'header', 'footer', 'nav', 'main'] as const;

type WrapperElement = (typeof WRAPPER_ELEMENTS)[number];

function wrapperNode(tag: WrapperElement) {
	return Node.create({
		name: `wrapper${tag[0]!.toUpperCase()}${tag.slice(1)}`,
		group: 'block',
		content: 'block+',
		defining: true,

		parseHTML() {
			return [{ tag, getAttrs: (element) => (isParsedAsWrapper(element) ? null : false) }];
		},

		renderHTML({ HTMLAttributes }) {
			return [tag, HTMLAttributes, 0];
		},
	});
}

function isParsedAsWrapper(element: HTMLElement): boolean {
	// page breaks are `div[data-page-break]` in the editor and belong to the pageBreak node
	if (element.hasAttribute('data-page-break')) return false;
	// a list item must start with a paragraph, so ProseMirror would move a leading wrapper out of the list
	return !(element.parentElement?.nodeName === 'LI' && startsParent(element));
}

function startsParent(element: HTMLElement): boolean {
	for (let node = element.previousSibling; node; node = node.previousSibling) {
		if (node.nodeType === 1 || node.textContent?.trim()) return false;
	}

	return true;
}

const WRAPPER_NODES = WRAPPER_ELEMENTS.map(wrapperNode);

export function buildWrapperElementSchema(keep: unknown): { extensions: AnyExtension[]; tags: string[]; key: string } {
	if (keep !== true) return { extensions: [], tags: [], key: '' };

	return { extensions: WRAPPER_NODES, tags: [...WRAPPER_ELEMENTS], key: 'wrapper-elements' };
}
