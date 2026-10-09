import { mergeAttributes, Node, VueNodeViewRenderer } from '@tiptap/vue-3';
import MediaNodeView from './media-node-view.vue';

export type MediaTag = 'video' | 'audio' | 'iframe';

export interface MediaAttrs {
	tag: MediaTag;
	src: string | null;
	type: string | null;
	width: number | null;
	height: number | null;
	controls: boolean;
	loop: boolean;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		media: {
			setMedia: (attrs: Partial<MediaAttrs>) => ReturnType;
		};
	}
}

// script-capable URL schemes; a javascript:/data: iframe would execute in the dashboard origin
const UNSAFE_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

// The URL parser normalizes case/whitespace obfuscation (" JaVaScRiPt:…") before the protocol check.
export function sanitizeMediaSrc(src: string | null): string | null {
	if (!src) return null;

	try {
		return UNSAFE_PROTOCOLS.includes(new URL(src, 'http://relative-url').protocol) ? null : src;
	} catch {
		return null;
	}
}

// Parse a numeric attribute; empty/absent/non-numeric → null so it renders as omitted.
function numberAttr(value: string | null): number | null {
	if (value === null || value === '') return null;
	const n = Number(value);
	return Number.isFinite(n) ? n : null;
}

// video/audio carry src/type on a child <source>; iframe carries src on the element.
function parseSourced(el: HTMLElement, tag: 'video' | 'audio'): MediaAttrs {
	const source = el.querySelector('source');
	return {
		tag,
		src: sanitizeMediaSrc(source?.getAttribute('src') ?? el.getAttribute('src')),
		type: source?.getAttribute('type') ?? null,
		width: numberAttr(el.getAttribute('width')),
		height: numberAttr(el.getAttribute('height')),
		controls: el.hasAttribute('controls'),
		loop: el.hasAttribute('loop'),
	};
}

export const Media = Node.create({
	name: 'media',
	group: 'block',
	atom: true,
	selectable: true,
	draggable: true,

	addStorage() {
		return { onOpenDrawer: null as null | (() => void) };
	},

	addAttributes() {
		// rendered: false — renderHTML serializes these manually; only global (preserved) attrs may
		// flow through the HTMLAttributes param
		return {
			tag: { default: 'video' as MediaTag, rendered: false },
			// explicit parseHTML: Tiptap's default (getAttribute) would override the sanitized
			// getAttrs value with the raw one; video/audio carry src on a child <source>
			src: {
				default: null,
				rendered: false,
				parseHTML: (el) => sanitizeMediaSrc(el.querySelector('source')?.getAttribute('src') ?? el.getAttribute('src')),
			},
			type: { default: null, rendered: false },
			width: { default: null, rendered: false },
			height: { default: null, rendered: false },
			// parseHTML prevents Tiptap's default fromString(getAttribute()) from converting "" → "" (falsy).
			controls: { default: false, rendered: false, parseHTML: (el) => el.hasAttribute('controls') },
			loop: { default: false, rendered: false, parseHTML: (el) => el.hasAttribute('loop') },
		};
	},

	parseHTML() {
		return [
			{ tag: 'video', getAttrs: (el) => parseSourced(el as HTMLElement, 'video') },
			{ tag: 'audio', getAttrs: (el) => parseSourced(el as HTMLElement, 'audio') },
			{
				tag: 'iframe',
				getAttrs: (el) => {
					const iframe = el as HTMLElement;
					return {
						tag: 'iframe',
						src: sanitizeMediaSrc(iframe.getAttribute('src')),
						type: null,
						width: numberAttr(iframe.getAttribute('width')),
						height: numberAttr(iframe.getAttribute('height')),
						controls: false,
						loop: false,
					} satisfies MediaAttrs;
				},
			},
		];
	},

	// DOMSerializer skips attributes whose value is null; boolean attrs become ="" (documented normalization).
	renderHTML({ node, HTMLAttributes }) {
		const { tag, src, type, width, height, controls, loop } = node.attrs as MediaAttrs;

		if (tag === 'iframe') {
			return ['iframe', mergeAttributes(HTMLAttributes, { src, width, height })];
		}

		return [
			tag,
			mergeAttributes(HTMLAttributes, { width, height, loop: loop ? '' : null, controls: controls ? '' : null }),
			['source', { src, type }],
		];
	},

	addCommands() {
		return {
			setMedia:
				(attrs) =>
				({ commands }) =>
					commands.insertContent({ type: this.name, attrs }),
		};
	},

	addNodeView() {
		return VueNodeViewRenderer(MediaNodeView);
	},
});
