import { type Editor, mergeAttributes } from '@tiptap/core';
import { Image } from '@tiptap/extension-image';
import type { DOMOutputSpec } from '@tiptap/pm/model';

/**
 * Image node extended with:
 *
 * - `loading`, so the drawer's lazy-loading option and legacy `loading="lazy"` markup survive
 *   parse → serialize (the base node only models src/alt/title/width/height).
 * - `href`/`target`/`rel`, modelling `<a href><img></a>`. The image is a block node and the Link
 *   mark only applies to inline content, so ProseMirror would otherwise drop the anchor on load
 *   and the normalization warning would lock the field. Keeping the link on the node (rather than
 *   making the image inline) leaves figures, drop cursor and stored bare `<img>` untouched.
 */

export type ImageLink = { href: string; target: string | null; rel: string | null };

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		imageLink: {
			/** Sets the link on the selected image; extra keys (eg `title`) are applied as image attributes. */
			setImageLink: (attrs: ImageLink & Record<string, unknown>) => ReturnType;
			unsetImageLink: () => ReturnType;
		};
	}
}

/** True when the selection is on an image that carries a link. */
export function isImageLinkActive(editor: Editor): boolean {
	return editor.isActive('image') && Boolean(editor.getAttributes('image').href);
}

/** Same allow-list as the Link mark; a scheme-less (relative) href is always allowed. */
const ALLOWED_PROTOCOLS = ['http', 'https', 'ftp', 'ftps', 'mailto', 'tel', 'callto', 'sms', 'cid', 'xmpp'];

function isAllowedHref(href: string): boolean {
	const scheme = href.trim().match(/^([a-z][a-z0-9+.-]*):/i)?.[1];
	return !scheme || ALLOWED_PROTOCOLS.includes(scheme.toLowerCase());
}

/**
 * The link of an anchor whose only content is `img`. An anchor that also wraps text stays a text
 * link (Link mark), so the image is not linked twice.
 */
function wrappingLink(img: HTMLElement): ImageLink | null {
	const anchor = img.parentElement;
	if (!anchor || anchor.tagName !== 'A') return null;

	const onlyImage = Array.from(anchor.childNodes).every(
		(child) => child === img || (child.nodeType === 3 && !child.textContent?.trim()),
	);

	const href = anchor.getAttribute('href');
	if (!onlyImage || !href || !isAllowedHref(href)) return null;

	return { href, target: anchor.getAttribute('target') || null, rel: anchor.getAttribute('rel') || null };
}

/** The anchor's attributes render on the wrapper `<a>` in `renderHTML`, never on the `<img>` itself. */
function linkAttribute(name: keyof ImageLink) {
	return {
		default: null,
		parseHTML: (element: HTMLElement) => wrappingLink(element)?.[name] ?? null,
		renderHTML: () => ({}),
	};
}

export const CustomImage = Image.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			loading: {
				default: null,
				parseHTML: (element) => element.getAttribute('loading'),
				renderHTML: (attributes) => (attributes.loading ? { loading: attributes.loading } : {}),
			},
			href: linkAttribute('href'),
			target: linkAttribute('target'),
			rel: linkAttribute('rel'),
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
					if (!isAllowedHref(attrs.href)) return false;
					return commands.updateAttributes(this.name, attrs);
				},
			unsetImageLink:
				() =>
				({ commands }) =>
					commands.updateAttributes(this.name, { href: null, target: null, rel: null }),
		};
	},
});
