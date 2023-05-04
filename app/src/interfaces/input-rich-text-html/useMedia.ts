import { getToken } from '@/api';
import { i18n } from '@/lang';
import { getPublicURL } from '@/utils/get-root-path';
import { computed, Ref, ref, watch } from 'vue';

type MediaSelection = {
	sourceUrl: string;
	width?: number;
	height?: number;
	tag?: 'video' | 'audio' | 'iframe';
	type?: string;
	previewUrl?: string;
};

type MediaButton = {
	icon: string;
	tooltip: string;
	onAction: (buttonApi: any) => void;
	onSetup: (buttonApi: any) => () => void;
};

type UsableMedia = {
	mediaDrawerOpen: Ref<boolean>;
	mediaSelection: Ref<MediaSelection | null>;
	closeMediaDrawer: () => void;
	openMediaTab: Ref<string[]>;
	onMediaSelect: (media: Record<string, any>) => void;
	embed: Ref<string>;
	saveMedia: () => void;
	startEmbed: Ref<string>;
	mediaHeight: Ref<number | undefined>;
	mediaWidth: Ref<number | undefined>;
	mediaSource: Ref<any>;
	mediaButton: MediaButton;
};

export default function useMedia(editor: Ref<any>, imageToken: Ref<string | undefined>): UsableMedia {
	const mediaDrawerOpen = ref(false);
	const mediaSelection = ref<MediaSelection | null>(null);
	const openMediaTab = ref(['video', 'audio']);
	const embed = ref('');
	const startEmbed = ref('');

	const mediaButton = {
		icon: 'embed',
		tooltip: i18n.global.t('wysiwyg_options.media'),
		onAction: (buttonApi: any) => {
			mediaDrawerOpen.value = true;

			if (buttonApi.isActive()) {
				if (editor.value.selection.getContent() === null) return;

				embed.value = editor.value.selection.getContent();
				startEmbed.value = embed.value;
			} else {
				mediaSelection.value = null;
			}
		},
		onSetup: (buttonApi: any) => {
			const onVideoNodeSelect = (eventApi: any) => {
				buttonApi.setActive(
					eventApi.element.tagName === 'SPAN' && eventApi.element.classList.contains('mce-preview-object')
				);
			};

			editor.value.on('NodeChange', onVideoNodeSelect);

			return function () {
				editor.value.off('NodeChange', onVideoNodeSelect);
			};
		},
	};

	const mediaSource = computed({
		get() {
			return mediaSelection.value?.sourceUrl;
		},
		set(newSource: any) {
			mediaSelection.value = {
				...mediaSelection.value,
				sourceUrl: newSource,
			};

			mediaSelection.value.previewUrl = replaceUrlAccessToken(newSource, imageToken.value || getToken());
		},
	});

	const mediaWidth = computed({
		get() {
			return mediaSelection.value?.width;
		},
		set(newSource: number | undefined) {
			if (mediaSelection.value === null) return;
			mediaSelection.value = { ...mediaSelection.value, width: newSource };
		},
	});

	const mediaHeight = computed({
		get() {
			return mediaSelection.value?.height;
		},
		set(newSource: number | undefined) {
			if (mediaSelection.value === null) return;
			mediaSelection.value = { ...mediaSelection.value, height: newSource };
		},
	});

	watch(mediaSelection, (vid) => {
		if (embed.value === '') {
			if (vid === null) return;
			embed.value = `<${vid.tag} width="${vid.width}" height="${vid.height}" controls><source src="${vid.sourceUrl}" type="${vid.type}" /></${vid.tag}>`;
		} else {
			embed.value = embed.value
				.replace(/src=".*?"/g, `src="${vid?.sourceUrl}"`)
				.replace(/width=".*?"/g, `width="${vid?.width}"`)
				.replace(/height=".*?"/g, `height="${vid?.height}"`)
				.replace(/type=".*?"/g, `type="${vid?.type}"`)
				.replaceAll(/<(video|audio|iframe)/g, `<${vid?.tag}`)
				.replaceAll(/<\/(video|audio|iframe)/g, `</${vid?.tag}`);
		}
	});

	watch(embed, (newEmbed) => {
		if (newEmbed === '') {
			mediaSelection.value = null;
		} else {
			const tag = /<(video|audio|iframe)/g.exec(newEmbed)?.[1] as 'video' | 'audio' | 'iframe' | undefined;
			const sourceUrl = /src="(.*?)"/g.exec(newEmbed)?.[1] || undefined;
			const width = Number(/width="(.*?)"/g.exec(newEmbed)?.[1]) || undefined;
			const height = Number(/height="(.*?)"/g.exec(newEmbed)?.[1]) || undefined;
			const type = /type="(.*?)"/g.exec(newEmbed)?.[1] || undefined;

			if (sourceUrl === undefined) return;

			// Add temporarily access token for preview
			const previewUrl = replaceUrlAccessToken(sourceUrl, imageToken.value || getToken());

			mediaSelection.value = {
				tag,
				sourceUrl,
				width,
				height,
				type,
				previewUrl,
			};
		}
	});

	return {
		mediaDrawerOpen,
		mediaSelection,
		closeMediaDrawer,
		openMediaTab,
		onMediaSelect,
		embed,
		saveMedia,
		startEmbed,
		mediaHeight,
		mediaWidth,
		mediaSource,
		mediaButton,
	};

	function closeMediaDrawer() {
		embed.value = '';
		startEmbed.value = '';
		mediaSelection.value = null;
		mediaDrawerOpen.value = false;
		openMediaTab.value = ['video'];
	}

	function onMediaSelect(media: Record<string, any>) {
		const sourceUrl = getPublicURL() + 'assets/' + media.id;
		const tag = media.type.startsWith('audio') ? 'audio' : 'video';

		mediaSelection.value = {
			sourceUrl: replaceUrlAccessToken(sourceUrl, imageToken.value),
			width: media.width || 300,
			height: media.height || 150,
			tag,
			type: media.type,
			previewUrl: replaceUrlAccessToken(sourceUrl, imageToken.value || getToken()),
		};
	}

	function saveMedia() {
		editor.value.fire('focus');

		if (embed.value === '') return;

		if (startEmbed.value !== '') {
			const updatedContent = editor.value.getContent().replace(startEmbed.value, embed.value);
			editor.value.setContent(updatedContent);
		} else {
			editor.value.selection.setContent(embed.value);
		}

		editor.value.undoManager.add();
		closeMediaDrawer();
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
