import type { AnyExtension } from '@tiptap/vue-3';
import { blockContainer } from './semantic-html';

/** Wrapper elements a field can opt into keeping. `section` and `article` are always kept (semantic-html.ts). */
export const WRAPPER_ELEMENTS = ['div', 'aside', 'header', 'footer', 'nav', 'main'] as const;

function isParsedAsWrapper(element: HTMLElement): null | false {
	// page breaks are `div[data-page-break]` in the editor and belong to the pageBreak node
	if (element.hasAttribute('data-page-break')) return false;
	// a list item must start with a paragraph, so ProseMirror would move a leading wrapper out of the list
	return element.parentElement?.nodeName === 'LI' && startsParent(element) ? false : null;
}

function startsParent(element: HTMLElement): boolean {
	for (let node = element.previousSibling; node; node = node.previousSibling) {
		if (node.nodeType === Node.ELEMENT_NODE) return false;
		if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) return false;
	}

	return true;
}

const WRAPPER_NODES = WRAPPER_ELEMENTS.map((tag) =>
	blockContainer(`wrapper${tag[0]!.toUpperCase()}${tag.slice(1)}`, tag, 'block+', isParsedAsWrapper),
);

export function buildWrapperElementSchema(keep: unknown): { extensions: AnyExtension[]; tags: string[]; key: string } {
	if (keep !== true) return { extensions: [], tags: [], key: '' };

	return { extensions: WRAPPER_NODES, tags: [...WRAPPER_ELEMENTS], key: 'wrapper-elements' };
}
