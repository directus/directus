import {
	type AnyExtension,
	Extension,
	type ExtensionAttribute,
	flattenExtensions,
	fromString,
	getAttributesFromExtensions,
} from '@tiptap/core';

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

const PASSTHROUGH_NAMES = ['class', 'id', 'title', 'role', 'lang', 'dir'] as const;

const WILDCARD_PREFIXES = ['data-', 'aria-'] as const;

/** The Tiptap attribute keys PreservedAttributes adds; other extensions must not redefine them. */
export const PRESERVED_ATTRIBUTE_KEYS: ReadonlySet<string> = new Set([
	...PASSTHROUGH_NAMES,
	'dataAttributes',
	'ariaAttributes',
]);

/** True when PreservedAttributes round-trips an HTML attribute with this name. */
export function isPreservedAttributeName(name: string): boolean {
	return (
		(PASSTHROUGH_NAMES as readonly string[]).includes(name) ||
		WILDCARD_PREFIXES.some((prefix) => name.startsWith(prefix))
	);
}

/** True when the element carries an attribute PreservedAttributes would round-trip. */
export function hasPreservedAttributes(element: HTMLElement): boolean {
	if (PASSTHROUGH_NAMES.some((name) => element.getAttribute(name))) return true;
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

/**
 * HTML names that other attributes of the type parse from this element and render back. Probed per
 * element with the parsed value, since an attribute's rendered name can depend on it.
 */
function ownedNames(element: HTMLElement, owners: ExtensionAttribute[]): Set<string> {
	const owned = new Set<string>();

	for (const { name, attribute } of owners) {
		if (!attribute.rendered) continue;

		const value = attribute.parseHTML ? attribute.parseHTML(element) : fromString(element.getAttribute(name));
		if (value === null || value === undefined) continue;

		const rendered = attribute.renderHTML ? attribute.renderHTML({ [name]: value }) : { [name]: value };
		for (const htmlName of Object.keys(rendered ?? {})) owned.add(htmlName);
	}

	return owned;
}

// an owned name is left to its owner; a second copy here would go stale once the owner changes it
function wildcardAttribute(name: string, prefix: (typeof WILDCARD_PREFIXES)[number], owners: ExtensionAttribute[]) {
	return {
		default: null,
		parseHTML: (element: HTMLElement) => {
			const matches = Array.from(element.attributes).filter(({ name: attrName }) => attrName.startsWith(prefix));
			if (matches.length === 0) return null;

			const owned = owners.length > 0 ? ownedNames(element, owners) : new Set<string>();
			const attrs: Record<string, string> = {};

			for (const { name: attrName, value } of matches) {
				if (!owned.has(attrName)) attrs[attrName] = value;
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

export interface PreservedAttributesOptions {
	/**
	 * The editor's other extensions. Tiptap hands addGlobalAttributes only the node and mark
	 * extensions, so global attributes from plain extensions are visible only through this list.
	 */
	extensions: AnyExtension[];
}

function attributesByType(extensions: AnyExtension[]): Map<string, ExtensionAttribute[]> {
	const byType = new Map<string, ExtensionAttribute[]>();

	for (const extensionAttribute of getAttributesFromExtensions(flattenExtensions(extensions))) {
		const list = byType.get(extensionAttribute.type) ?? [];
		list.push(extensionAttribute);
		byType.set(extensionAttribute.type, list);
	}

	return byType;
}

export const PreservedAttributes = Extension.create<PreservedAttributesOptions>({
	name: 'preservedAttributes',

	addOptions() {
		return { extensions: [] };
	},

	addGlobalAttributes() {
		const types = this.extensions.map((extension) => extension.name).filter((name) => !EXCLUDED_TYPES.has(name));
		const owners = attributesByType(this.options.extensions);

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
				},
			},
			// one entry per type, as each type has its own set of attributes that may own a name
			...types.map((type) => ({
				types: [type],
				attributes: {
					dataAttributes: wildcardAttribute('dataAttributes', 'data-', owners.get(type) ?? []),
					ariaAttributes: wildcardAttribute('ariaAttributes', 'aria-', owners.get(type) ?? []),
				},
			})),
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
