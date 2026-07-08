import type { File } from '@directus/types';
import { DOMParser as PMDOMParser } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/vue-3';
import { Ref, ref, watch } from 'vue';
import type { MediaAttrs, MediaTag } from '../extensions/media';
import { getPublicURL } from '@/utils/get-root-path';

export type MediaSelection = {
	tag: MediaTag;
	src: string | null;
	type: string | null;
	width: number | null;
	height: number | null;
	controls: boolean;
	loop: boolean;
	previewUrl: string | null;
};

type UsableMedia = {
	mediaDrawerOpen: Ref<boolean>;
	mediaSelection: Ref<MediaSelection | null>;
	embed: Ref<string>;
	embedInvalid: Ref<boolean>;
	activeTab: Ref<string[]>;
	openMediaDrawer: () => void;
	closeMediaDrawer: () => void;
	onMediaSelect: (file: File) => void;
	saveMedia: () => void;
};

// Library selections default to sensible dimensions when the file has none, matching the legacy editor.
const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 150;

export function useMedia(editor: Ref<Editor>, imageToken: Ref<string | undefined>): UsableMedia {
	const mediaDrawerOpen = ref(false);
	const mediaSelection = ref<MediaSelection | null>(null);
	const embed = ref('');
	const embedInvalid = ref(false);
	const activeTab = ref<string[]>(['media']);

	watch(embed, () => (embedInvalid.value = false));

	return {
		mediaDrawerOpen,
		mediaSelection,
		embed,
		embedInvalid,
		activeTab,
		openMediaDrawer,
		closeMediaDrawer,
		onMediaSelect,
		saveMedia,
	};

	// Opens the drawer; on an active media node, prefill the form for editing, else start empty.
	function openMediaDrawer() {
		mediaDrawerOpen.value = true;
		activeTab.value = ['media'];

		if (!editor.value.isActive('media')) {
			mediaSelection.value = null;
			embed.value = '';
			return;
		}

		const attrs = editor.value.getAttributes('media') as MediaAttrs;

		mediaSelection.value = {
			tag: attrs.tag,
			src: attrs.src ?? null,
			type: attrs.type ?? null,
			width: attrs.width ?? null,
			height: attrs.height ?? null,
			controls: attrs.controls ?? false,
			loop: attrs.loop ?? false,
			previewUrl: replaceUrlAccessToken(attrs.src ?? '', imageToken.value),
		};
	}

	function closeMediaDrawer() {
		mediaSelection.value = null;
		embed.value = '';
		embedInvalid.value = false;
		activeTab.value = ['media'];
		mediaDrawerOpen.value = false;
	}

	function onMediaSelect(file: File) {
		const src = getPublicURL() + 'assets/' + file.id;
		const tokenized = replaceUrlAccessToken(src, imageToken.value);
		const tag: MediaTag = file.type?.startsWith('audio') ? 'audio' : 'video';

		mediaSelection.value = {
			tag,
			src: tokenized,
			type: file.type ?? null,
			width: file.width ?? DEFAULT_WIDTH,
			height: file.height ?? DEFAULT_HEIGHT,
			controls: true,
			loop: false,
			previewUrl: tokenized,
		};
	}

	function saveMedia() {
		const attrs = activeTab.value.includes('embed') ? parseEmbed(embed.value) : selectionToAttrs();

		// File tab with no selection is a no-op; embed tab that parsed to nothing is a rejection,
		// surfaced inline in the drawer (a toast would render behind the drawer overlay).
		if (!attrs || !attrs.src) {
			embedInvalid.value = activeTab.value.includes('embed') && !!embed.value.trim();
			return;
		}

		editor.value.chain().focus().setMedia(attrs).run();
		closeMediaDrawer();
	}

	function selectionToAttrs(): Partial<MediaAttrs> | null {
		const sel = mediaSelection.value;
		if (!sel || !sel.src) return null;

		return {
			tag: sel.tag,
			src: sel.src,
			type: sel.type,
			width: sel.width,
			height: sel.height,
			controls: sel.controls,
			loop: sel.loop,
		};
	}

	// Parse pasted markup through the editor's own schema (media parse rules); return the first media
	// node's attrs, or null if nothing representable is found.
	function parseEmbed(html: string): Partial<MediaAttrs> | null {
		if (!html.trim()) return null;

		const body = new DOMParser().parseFromString(html, 'text/html').body;
		const fragment = PMDOMParser.fromSchema(editor.value.schema).parseSlice(body).content;

		let attrs: Partial<MediaAttrs> | null = null;

		fragment.descendants((node) => {
			if (attrs) return false;
			if (node.type.name === 'media') attrs = { ...(node.attrs as MediaAttrs) };
			return true;
		});

		return attrs;
	}

	function replaceUrlAccessToken(url: string, token: string | null | undefined): string {
		// Only process assets URL
		if (!url.includes(getPublicURL() + 'assets/')) {
			return url;
		}

		try {
			const parsedUrl = new URL(url);
			const params = new URLSearchParams(parsedUrl.search);

			if (!token) {
				params.delete('access_token');
			} else {
				params.set('access_token', token);
			}

			return Array.from(params).length > 0
				? `${parsedUrl.origin}${parsedUrl.pathname}?${params.toString()}`
				: `${parsedUrl.origin}${parsedUrl.pathname}`;
		} catch {
			return url;
		}
	}
}
