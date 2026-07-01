import { Node } from '@tiptap/vue-3';

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
		src: source?.getAttribute('src') ?? el.getAttribute('src') ?? null,
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

	addAttributes() {
		return {
			tag: { default: 'video' as MediaTag },
			src: { default: null },
			type: { default: null },
			width: { default: null },
			height: { default: null },
			// parseHTML prevents Tiptap's default fromString(getAttribute()) from converting "" → "" (falsy).
			controls: { default: false, parseHTML: (el) => el.hasAttribute('controls') },
			loop: { default: false, parseHTML: (el) => el.hasAttribute('loop') },
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
						src: iframe.getAttribute('src'),
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
	renderHTML({ node }) {
		const { tag, src, type, width, height, controls, loop } = node.attrs as MediaAttrs;

		if (tag === 'iframe') {
			return ['iframe', { src, width, height }];
		}

		return [tag, { width, height, loop: loop ? '' : null, controls: controls ? '' : null }, ['source', { src, type }]];
	},

	addCommands() {
		return {
			setMedia:
				(attrs) =>
				({ commands }) =>
					commands.insertContent({ type: this.name, attrs }),
		};
	},
});
