import { Extension } from '@tiptap/core';

/**
 * Round-trips `class`, `id`, `title`, `role`, `lang`, `dir`, `data-*` and `aria-*` on every node and
 * mark type so stored HTML that relies on them (styling hooks, anchors, tooltips, accessibility,
 * i18n) survives edit + save. Each wildcard prefix is collected into one record attribute (tiptap
 * has no native wildcard support). Event handlers (`on*`) and `style` are never preserved.
 */

/**
 * Types that serialize a fixed attribute set and must not carry preserved attributes
 * (comparisonDiff derives its class from its own `type` attribute).
 */
const EXCLUDED_TYPES = new Set(['doc', 'text', 'pageBreak', 'comparisonDiff']);

/** Types that already model `title` on their own attributes; a global `title` would double-render. */
const OWN_TITLE_TYPES = new Set(['link', 'abbreviation']);

/** Block types the Direction extension already models `dir` on; a global `dir` would double-render. */
const OWN_DIR_TYPES = new Set(['paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem']);

const WILDCARD_PREFIXES = ['data-', 'aria-'] as const;

/** True when the element carries an attribute PreservedAttributes would round-trip. */
export function hasPreservedAttributes(element: HTMLElement): boolean {
	if (['class', 'id', 'title', 'role', 'lang', 'dir'].some((name) => element.getAttribute(name))) return true;
	return Array.from(element.attributes).some(({ name }) => WILDCARD_PREFIXES.some((prefix) => name.startsWith(prefix)));
}

/** A plain string attribute round-tripped verbatim; empty → dropped so it never churns. */
function passthroughAttribute(name: string) {
	return {
		default: null,
		parseHTML: (element: HTMLElement) => element.getAttribute(name) || null,
		renderHTML: (attributes: Record<string, unknown>) => (attributes[name] ? { [name]: attributes[name] } : {}),
	};
}

function wildcardAttribute(name: string, prefix: (typeof WILDCARD_PREFIXES)[number]) {
	return {
		default: null,
		parseHTML: (element: HTMLElement) => {
			const attrs: Record<string, string> = {};

			for (const { name: attrName, value } of Array.from(element.attributes)) {
				if (attrName.startsWith(prefix)) attrs[attrName] = value;
			}

			return Object.keys(attrs).length > 0 ? attrs : null;
		},
		renderHTML: (attributes: Record<string, unknown>) => {
			const record = attributes[name] as Record<string, string> | null;
			if (!record) return {};

			const rendered: Record<string, string> = {};

			// re-check the prefix so programmatically set attrs can't smuggle arbitrary names
			for (const [attrName, value] of Object.entries(record)) {
				if (attrName.startsWith(prefix)) rendered[attrName] = value;
			}

			return rendered;
		},
	};
}

export const PreservedAttributes = Extension.create({
	name: 'preservedAttributes',

	addGlobalAttributes() {
		const types = this.extensions.map((extension) => extension.name).filter((name) => !EXCLUDED_TYPES.has(name));

		return [
			{
				types,
				attributes: {
					class: passthroughAttribute('class'),
					id: {
						...passthroughAttribute('id'),
						// splitting a block must not duplicate a unique id
						keepOnSplit: false,
					},
					role: passthroughAttribute('role'),
					lang: passthroughAttribute('lang'),
					dataAttributes: wildcardAttribute('dataAttributes', 'data-'),
					ariaAttributes: wildcardAttribute('ariaAttributes', 'aria-'),
				},
			},
			{
				// link/abbreviation model their own `title`; a global one there would double-render
				types: types.filter((name) => !OWN_TITLE_TYPES.has(name)),
				attributes: { title: passthroughAttribute('title') },
			},
			{
				// Direction models `dir` on block nodes (with commands); add it to the rest — inline
				// marks, spans, cells — so mixed-direction inline runs like `<span dir="rtl">` survive
				types: types.filter((name) => !OWN_DIR_TYPES.has(name)),
				attributes: { dir: passthroughAttribute('dir') },
			},
		];
	},
});
