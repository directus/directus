import { type AnyExtension, Extension } from '@tiptap/core';
import { DOMSerializer, type Fragment, type Schema } from '@tiptap/pm/model';

const CONTAINER_TAGS = ['li', 'blockquote', 'td', 'th'];

function toNodeNames(tags: string[]): ReadonlySet<string> {
	return new Set(tags.map((tag) => tag.toUpperCase()));
}

// `renderHTML` must return a real element, so a paragraph cannot drop its own wrapper there
class NoContainerParagraphSerializer extends DOMSerializer {
	constructor(
		schema: Schema,
		private readonly containerTags: ReadonlySet<string>,
	) {
		super(DOMSerializer.nodesFromSchema(schema), DOMSerializer.marksFromSchema(schema));
	}

	override serializeFragment(
		fragment: Fragment,
		options?: { document?: Document },
		target?: HTMLElement | DocumentFragment,
	): HTMLElement | DocumentFragment {
		const dom = super.serializeFragment(fragment, options, target);
		const first = fragment.firstChild;

		if (!target || !this.containerTags.has(target.nodeName)) return dom;
		if (first?.type.name !== 'paragraph' || first.attrs['keepWrapper']) return dom;
		// with no `<p>`, an empty first paragraph disappears on reload
		if (first.content.size === 0 && fragment.childCount > 1) return dom;

		const paragraph = target.firstChild as Element;
		// unwrapping would lose the paragraph's alignment, class, or other attributes
		if (paragraph.attributes.length === 0) paragraph.replaceWith(...paragraph.childNodes);

		return dom;
	}
}

export interface NoContainerParagraphsOptions {
	tags: string[];
}

/**
 * Never adds `<p>` as the first child of the `tags` elements. A stored `<p>` there stays.
 * Only one serializer can be seeded, so every option that needs this shares one configured instance.
 */
export const NoContainerParagraphs = Extension.create<NoContainerParagraphsOptions>({
	name: 'noContainerParagraphs',

	addOptions() {
		return { tags: CONTAINER_TAGS };
	},

	addGlobalAttributes() {
		const containerTags = toNodeNames(this.options.tags);

		return [
			{
				types: ['paragraph'],
				attributes: {
					keepWrapper: {
						default: false,
						rendered: false,
						keepOnSplit: false,
						// a top-level `<p>` does not count, or turning it into a list would write `<li><p>`
						parseHTML: (element) => containerTags.has(element.parentElement?.nodeName ?? ''),
					},
				},
			},
		];
	},

	onBeforeCreate() {
		this.editor.schema.cached['domSerializer'] = new NoContainerParagraphSerializer(
			this.editor.schema,
			toNodeNames(this.options.tags),
		);
	},
});

/** `wrapperTags` always get the serializer, so a kept `<div>text</div>` does not gain a `<p>`. */
export function buildContainerParagraphSchema(
	noContainerParagraphs: unknown,
	wrapperTags: string[],
): { extensions: AnyExtension[]; key: string } {
	const tags = [...(noContainerParagraphs === true ? CONTAINER_TAGS : []), ...wrapperTags];

	return {
		extensions: tags.length > 0 ? [NoContainerParagraphs.configure({ tags })] : [],
		key: noContainerParagraphs === true ? 'no-container-paragraphs' : '',
	};
}
