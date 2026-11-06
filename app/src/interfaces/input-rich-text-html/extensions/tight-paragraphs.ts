import { Extension } from '@tiptap/core';
import { DOMSerializer, type Fragment, type Schema } from '@tiptap/pm/model';

const CONTAINER_TAGS = new Set(['LI', 'BLOCKQUOTE', 'TD', 'TH']);

// `renderHTML` must return a real element, so a paragraph cannot drop its own wrapper there
class TightParagraphSerializer extends DOMSerializer {
	override serializeFragment(
		fragment: Fragment,
		options?: { document?: Document },
		target?: HTMLElement | DocumentFragment,
	): HTMLElement | DocumentFragment {
		const dom = super.serializeFragment(fragment, options, target);
		const first = fragment.firstChild;

		if (!target || !CONTAINER_TAGS.has(target.nodeName)) return dom;
		if (first?.type.name !== 'paragraph' || first.attrs['keepWrapper']) return dom;
		// with no `<p>`, an empty first paragraph disappears on reload
		if (first.content.size === 0 && fragment.childCount > 1) return dom;

		const paragraph = target.firstChild as Element;
		// unwrapping would lose the paragraph's alignment, class, or other attributes
		if (paragraph.attributes.length === 0) paragraph.replaceWith(...paragraph.childNodes);

		return dom;
	}
}

function seedTightParagraphSerializer(schema: Schema) {
	schema.cached['domSerializer'] = new TightParagraphSerializer(
		DOMSerializer.nodesFromSchema(schema),
		DOMSerializer.marksFromSchema(schema),
	);
}

/**
 * Never adds `<p>` in list items, blockquotes and table cells. A stored `<p>` there stays.
 * Every output path gets this through `DOMSerializer.fromSchema`; the editor view does not.
 */
export const TightParagraphs = Extension.create({
	name: 'tightParagraphs',

	addGlobalAttributes() {
		return [
			{
				types: ['paragraph'],
				attributes: {
					keepWrapper: {
						default: false,
						rendered: false,
						keepOnSplit: false,
						// a top-level `<p>` does not count, or turning it into a list would write `<li><p>`
						parseHTML: (element) => CONTAINER_TAGS.has(element.parentElement?.nodeName ?? ''),
					},
				},
			},
		];
	},

	onBeforeCreate() {
		seedTightParagraphSerializer(this.editor.schema);
	},
});
