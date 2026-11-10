import {
	type AnyExtension,
	Extension,
	type ExtensionAttribute,
	flattenExtensions,
	fromString,
	getAttributesFromExtensions,
	getExtensionField,
} from '@tiptap/core';
import type { ParseRule, StyleParseRule } from '@tiptap/pm/model';
import { StyleTag } from './style-tag';

/**
 * Round-trips `class`, `id`, `title`, `role`, `lang`, `dir`, `data-*` and `aria-*` on every node and
 * mark type so stored HTML that relies on them (styling hooks, anchors, tooltips, accessibility,
 * i18n) survives edit + save. Each wildcard prefix is collected into one record attribute (tiptap
 * has no native wildcard support). With the `inlineStyles` option, `style` round-trips too, minus
 * the declarations another extension owns. Event handlers (`on*`) are never preserved.
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

/** ProseMirror stamps copied HTML with its slice context; transport metadata, never content. */
const TRANSPORT_ATTRIBUTES = new Set(['data-pm-slice']);

/** The Tiptap attribute keys PreservedAttributes adds; other extensions must not redefine them. */
export const PRESERVED_ATTRIBUTE_KEYS: ReadonlySet<string> = new Set([
	...PASSTHROUGH_NAMES,
	'dataAttributes',
	'ariaAttributes',
	'inlineStyle',
]);

/** True when PreservedAttributes round-trips an HTML attribute with this name. */
export function isPreservedAttributeName(name: string): boolean {
	return (
		(PASSTHROUGH_NAMES as readonly string[]).includes(name) ||
		WILDCARD_PREFIXES.some((prefix) => name.startsWith(prefix))
	);
}

function isWildcardAttribute(name: string): boolean {
	return !TRANSPORT_ATTRIBUTES.has(name) && WILDCARD_PREFIXES.some((prefix) => name.startsWith(prefix));
}

/** True when the element carries an attribute PreservedAttributes would round-trip. */
export function hasPreservedAttributes(element: HTMLElement): boolean {
	if (PASSTHROUGH_NAMES.some((name) => element.getAttribute(name))) return true;
	return Array.from(element.attributes).some(({ name }) => isWildcardAttribute(name));
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
 * What the other attributes of the type parse from this element and render back. Probed per element
 * with the parsed value, since an attribute's rendered output can depend on it.
 */
function ownerRenders(element: HTMLElement, owners: ExtensionAttribute[]): Record<string, unknown>[] {
	const renders: Record<string, unknown>[] = [];

	for (const { name, attribute } of owners) {
		if (!attribute.rendered) continue;

		const value = attribute.parseHTML ? attribute.parseHTML(element) : fromString(element.getAttribute(name));
		if (value === null || value === undefined) continue;

		renders.push(attribute.renderHTML ? (attribute.renderHTML({ [name]: value }) ?? {}) : { [name]: value });
	}

	return renders;
}

function ownedNames(element: HTMLElement, owners: ExtensionAttribute[]): Set<string> {
	return new Set(ownerRenders(element, owners).flatMap((rendered) => Object.keys(rendered)));
}

function ownedStyleProperties(element: HTMLElement, owners: ExtensionAttribute[]): string[] {
	return ownerRenders(element, owners).flatMap((rendered) =>
		styleDeclarations(String(rendered['style'] ?? '')).map(([property]) => property),
	);
}

/** Splits CSS declarations on `;`, except inside quotes or parentheses (`url(data:...;base64,...)`). */
function styleDeclarations(css: string): [property: string, value: string][] {
	const declarations: [string, string][] = [];
	let quote: string | null = null;
	let depth = 0;
	let start = 0;

	const push = (end: number) => {
		const declaration = css.slice(start, end);
		const colon = declaration.indexOf(':');
		const property = declaration.slice(0, colon).trim().toLowerCase();
		const value = declaration.slice(colon + 1).trim();
		if (colon > 0 && property && value) declarations.push([property, value]);
	};

	for (let i = 0; i < css.length; i++) {
		const char = css[i];

		if (quote) {
			if (char === quote) quote = null;
		} else if (char === '"' || char === "'") {
			quote = char;
		} else if (char === '(') {
			depth++;
		} else if (char === ')' && depth > 0) {
			depth--;
		} else if (char === ';' && depth === 0) {
			push(i);
			start = i + 1;
		}
	}

	push(css.length);
	return declarations;
}

export type StyleRule = Pick<StyleParseRule, 'style' | 'getAttrs'>;

/** The schema's style parse rules that make a mark, so a clear-only rule (`font-weight: 400`) stays a style. */
export function styleRules(extensions: AnyExtension[]): StyleRule[] {
	return flattenExtensions(extensions)
		.filter((extension) => extension.type === 'mark' || extension.type === 'node')
		.flatMap((extension) => {
			const parseHTML = getExtensionField<() => readonly ParseRule[] | undefined>(extension, 'parseHTML', {
				name: extension.name,
				options: extension.options,
				storage: extension.storage,
			});

			return (parseHTML?.() ?? []).filter(
				(rule): rule is StyleParseRule => 'style' in rule && !!rule.style && !rule.clearMark,
			);
		});
}

function claimsDeclaration(rule: StyleRule, property: string, value: string): boolean {
	const [ruleProperty, ruleValue] = rule.style.split('=');
	if (ruleProperty !== property) return false;
	if (ruleValue !== undefined && ruleValue !== value) return false;
	return rule.getAttrs?.(value) !== false;
}

// a shorthand such as `background` or `font` also sets owned longhands, so the browser's CSS parser decides
function isOwnedDeclaration(property: string, value: string, ownedProperties: string[], rules: StyleRule[]): boolean {
	const probe = document.createElement('span');
	probe.style.setProperty(property, value);
	const valueOf = (name: string) => (name === property ? value : probe.style.getPropertyValue(name));

	return (
		ownedProperties.some((owned) => valueOf(owned) !== '') ||
		rules.some((rule) => {
			const ruleProperty = rule.style.split('=')[0]!;
			const ruleValue = valueOf(ruleProperty);
			return ruleValue !== '' && claimsDeclaration(rule, ruleProperty, ruleValue);
		})
	);
}

/** True when the element has a declaration that no style rule turns into a mark. */
export function hasUnclaimedDeclaration(element: HTMLElement, rules: StyleRule[]): boolean {
	return styleDeclarations(element.getAttribute('style') ?? '').some(
		([property, value]) => !isOwnedDeclaration(property, value, [], rules),
	);
}

// owned declarations are left to their owner; a second copy here would win over its later changes
function inlineStyleAttribute(owners: ExtensionAttribute[], rules: StyleRule[]) {
	return {
		default: null,
		parseHTML: (element: HTMLElement) => {
			const raw = element.getAttribute('style');
			if (!raw) return null;

			const owned = owners.length > 0 ? ownedStyleProperties(element, owners) : [];

			const kept = styleDeclarations(raw).filter(
				([property, value]) => !isOwnedDeclaration(property, value, owned, rules),
			);

			return kept.length > 0 ? kept.map(([property, value]) => `${property}: ${value};`).join(' ') : null;
		},
		renderHTML: (attributes: Record<string, unknown>) =>
			attributes['inlineStyle'] ? { style: attributes['inlineStyle'] } : {},
	};
}

// an owned name is left to its owner; a second copy here would go stale once the owner changes it
function wildcardAttribute(name: string, prefix: (typeof WILDCARD_PREFIXES)[number], owners: ExtensionAttribute[]) {
	return {
		default: null,
		parseHTML: (element: HTMLElement) => {
			const matches = Array.from(element.attributes).filter(
				({ name: attrName }) => attrName.startsWith(prefix) && isWildcardAttribute(attrName),
			);

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
	/** Keep the `style` attribute, minus the declarations another extension owns. */
	inlineStyles: boolean;
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
		return { extensions: [], inlineStyles: false };
	},

	addGlobalAttributes() {
		const types = this.extensions.map((extension) => extension.name).filter((name) => !EXCLUDED_TYPES.has(name));
		const owners = attributesByType(this.options.extensions);
		const rules = this.options.inlineStyles ? styleRules(this.options.extensions) : [];

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
					...(this.options.inlineStyles && type !== StyleTag.name
						? { inlineStyle: inlineStyleAttribute(owners.get(type) ?? [], rules) }
						: {}),
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
