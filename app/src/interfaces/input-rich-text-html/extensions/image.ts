import { type Attributes, type Editor, mergeAttributes, type Node } from '@tiptap/core';
import { Image, type ImageOptions } from '@tiptap/extension-image';
import { isAllowedUri } from '@tiptap/extension-link';
import type { DOMOutputSpec, Node as ProseMirrorNode, TagParseRule } from '@tiptap/pm/model';

/**
 * Block image (`InlineImage` below takes `<img>` in paragraph, heading and list item text), extended with:
 *
 * - `loading`, so the drawer's lazy-loading option and legacy `loading="lazy"` markup survive
 *   parse → serialize (the base node only models src/alt/title/width/height).
 * - `href`/`target`/`rel`, modelling `<a href><img></a>`. The Link mark only applies to inline
 *   content, so ProseMirror would otherwise drop the anchor around a block image on load and the
 *   normalization warning would lock the field.
 */

export type ImageLink = { href: string; target: string | null; rel: string | null };

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		imageLink: {
			/** Sets the link on the selected image; `title` is the image's own tooltip. */
			setImageLink: (attrs: ImageLink & { title?: string | null }) => ReturnType;
			/** Also clears `title`: only the link drawer can set it, so keeping it would strand it on the image. */
			unsetImageLink: () => ReturnType;
		};
	}
}

export const IMAGE_NODE = 'image';

export const INLINE_IMAGE_NODE = 'inlineImage';

export const IMAGE_LINK_ATTRIBUTES = ['href', 'target', 'rel'] as const satisfies readonly (keyof ImageLink)[];

export function isImageNode(node: ProseMirrorNode): boolean {
	return node.type.name === IMAGE_NODE || node.type.name === INLINE_IMAGE_NODE;
}

/** The attributes without the block image's own link, which an inline image holds as the Link mark. */
export function withoutImageLink<T>(attrs: Record<string, T>): Record<string, T> {
	return Object.fromEntries(
		Object.entries(attrs).filter(([name]) => !(IMAGE_LINK_ATTRIBUTES as readonly string[]).includes(name)),
	);
}

export function isImageLinkActive(editor: Editor): boolean {
	return editor.isActive(IMAGE_NODE) && Boolean(editor.getAttributes(IMAGE_NODE).href);
}

/** The image type the selection is on, or `null` when it is not on an image. */
export function activeImageType(editor: Editor): typeof IMAGE_NODE | typeof INLINE_IMAGE_NODE | null {
	if (editor.isActive(IMAGE_NODE)) return IMAGE_NODE;
	if (editor.isActive(INLINE_IMAGE_NODE)) return INLINE_IMAGE_NODE;
	return null;
}

/**
 * The link of an anchor whose only content is `img`. An anchor that also wraps text stays a text
 * link (Link mark), so the image is not linked twice.
 */
function wrappingLink(img: HTMLElement, protocols: string[]): ImageLink | null {
	const anchor = img.parentElement;
	if (!anchor || anchor.tagName !== 'A') return null;

	const onlyImage = Array.from(anchor.childNodes).every(
		(child) => child === img || (child.nodeType === 3 && !child.textContent?.trim()),
	);

	const href = anchor.getAttribute('href');
	// same allow-list as the Link mark, so an image link cannot smuggle in what a text link rejects
	if (!onlyImage || !href || !isAllowedUri(href, protocols)) return null;

	return { href, target: anchor.getAttribute('target') || null, rel: anchor.getAttribute('rel') || null };
}

/** The anchor's attributes render on the wrapper `<a>` in `renderHTML`, never on the `<img>` itself. */
function linkAttribute(name: keyof ImageLink, protocols: string[]) {
	return {
		default: null,
		parseHTML: (element: HTMLElement) => wrappingLink(element, protocols)?.[name] ?? null,
		renderHTML: () => ({}),
	};
}

export const CustomImage = Image.extend<ImageOptions & { linkProtocols: string[] }>({
	addOptions() {
		return { ...this.parent!(), linkProtocols: [] };
	},

	addAttributes() {
		return {
			...this.parent?.(),
			loading: {
				default: null,
				parseHTML: (element) => element.getAttribute('loading'),
				renderHTML: (attributes) => (attributes.loading ? { loading: attributes.loading } : {}),
			},
			href: linkAttribute('href', this.options.linkProtocols),
			target: linkAttribute('target', this.options.linkProtocols),
			rel: linkAttribute('rel', this.options.linkProtocols),
		};
	},

	renderHTML({ node, HTMLAttributes }) {
		const img: DOMOutputSpec = ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
		const { href, target, rel } = node.attrs;

		if (!href) return img;

		return ['a', { href, target, rel }, img];
	},

	addCommands() {
		return {
			...this.parent?.(),
			setImageLink:
				(attrs) =>
				({ commands }) => {
					// same guard as parsing, so the drawer cannot store what a load would drop
					if (!isAllowedUri(attrs.href, this.options.linkProtocols)) return false;
					return commands.updateAttributes(this.name, attrs);
				},
			unsetImageLink:
				() =>
				({ commands }) =>
					commands.updateAttributes(this.name, { href: null, target: null, rel: null, title: null }),
		};
	},
});

const INLINE_IMAGE_HOSTS = new Set(['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI']);

const BLOCK_ANCESTORS = [
	...Array.from(INLINE_IMAGE_HOSTS, (tag) => tag.toLowerCase()),
	'address',
	'article',
	'aside',
	'blockquote',
	'body',
	'dd',
	'details',
	'div',
	'dl',
	'dt',
	'figcaption',
	'figure',
	'footer',
	'header',
	'main',
	'nav',
	'ol',
	'pre',
	'section',
	'summary',
	'table',
	'td',
	'th',
	'ul',
].join(',');

const BLOCK_SIBLINGS = `${BLOCK_ANCESTORS},hr,iframe,video,audio`;

/** True when the parser reads this `<img>` as an inline image. */
export function isInInlineImageHost(img: HTMLElement): boolean {
	const block = img.parentElement?.closest(BLOCK_ANCESTORS);
	if (!block || !INLINE_IMAGE_HOSTS.has(block.tagName)) return false;
	return block.tagName !== 'LI' || !followsBlockInListItem(img, block);
}

// Tiptap stores a block image in a list item after the item's first paragraph (`<li><p>a</p><img></li>`)
function followsBlockInListItem(img: HTMLElement, item: Element): boolean {
	let child: Element = img;
	while (child.parentElement !== item) child = child.parentElement!;

	for (let sibling = child.previousElementSibling; sibling; sibling = sibling.previousElementSibling) {
		if (sibling.matches(BLOCK_SIBLINGS)) return true;
	}

	return false;
}

/**
 * The inline variant of a block image node, for `<img>` in paragraph, heading and list item text.
 * Its link is the Link mark, and it has no commands, so `setImage` always inserts a block image.
 */
export function inlineImageOf(blockImage: Node) {
	return blockImage.extend({
		name: INLINE_IMAGE_NODE,
		inline: true,
		group: 'inline',

		addAttributes() {
			return withoutImageLink((this.parent?.() ?? {}) as Attributes);
		},

		parseHTML() {
			return ((this.parent?.() ?? []) as TagParseRule[])
				.filter((rule) => rule.tag)
				.map((rule) => ({
					...rule,
					// ahead of the block image's rule, which takes every <img> this one declines
					priority: 60,
					getAttrs: (element: HTMLElement) => {
						if (!isInInlineImageHost(element)) return false;
						return rule.getAttrs?.(element) ?? null;
					},
				}));
		},

		addCommands() {
			return {};
		},

		addInputRules() {
			return [];
		},
	});
}

export const InlineImage = inlineImageOf(CustomImage);
