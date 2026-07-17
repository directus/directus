import { Extension } from '@tiptap/core';

/**
 * Round-trips `class`, `id`, `data-*` and `aria-*` on every node and mark type so stored HTML that
 * relies on them (styling hooks, anchors, tooltips) survives edit + save. Each wildcard prefix is
 * collected into one record attribute (tiptap has no native wildcard support). The whitelist is
 * exactly these four — event handlers (`on*`) and `style` are never preserved.
 */

/**
 * Types that serialize a fixed attribute set and must not carry preserved attributes
 * (comparisonDiff derives its class from its own `type` attribute).
 */
const EXCLUDED_TYPES = new Set(['doc', 'text', 'pageBreak', 'comparisonDiff']);

const WILDCARD_PREFIXES = ['data-', 'aria-'] as const;

/** True when the element carries an attribute PreservedAttributes would round-trip. */
export function hasPreservedAttributes(element: HTMLElement): boolean {
	if (element.getAttribute('class') || element.getAttribute('id')) return true;
	return Array.from(element.attributes).some(({ name }) => WILDCARD_PREFIXES.some((prefix) => name.startsWith(prefix)));
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
		return [
			{
				types: this.extensions.map((extension) => extension.name).filter((name) => !EXCLUDED_TYPES.has(name)),
				attributes: {
					class: {
						default: null,
						parseHTML: (element) => element.getAttribute('class') || null,
						renderHTML: (attributes) => (attributes.class ? { class: attributes.class } : {}),
					},
					id: {
						default: null,
						// splitting a block must not duplicate a unique id
						keepOnSplit: false,
						parseHTML: (element) => element.getAttribute('id') || null,
						renderHTML: (attributes) => (attributes.id ? { id: attributes.id } : {}),
					},
					dataAttributes: wildcardAttribute('dataAttributes', 'data-'),
					ariaAttributes: wildcardAttribute('ariaAttributes', 'aria-'),
				},
			},
		];
	},
});
