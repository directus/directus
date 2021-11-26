import { addTokenToURL } from '@/api';
import { i18n } from '@/lang';
import { getPublicURL } from '@/utils/get-root-path';
import { computed, Ref, ref, watch } from 'vue';

type MediaSelection = {
	source: string;
	width?: number;
	height?: number;
	tag?: 'video' | 'audio';
	type?: string;
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

export default function useMedia(
	editor: Ref<any>,
	isEditorDirty: Ref<boolean>,
	imageToken: Ref<string | undefined>
): UsableMedia {
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
			return mediaSelection.value?.source;
		},
		set(newSource: any) {
			mediaSelection.value = { ...mediaSelection.value, source: newSource };
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
			embed.value = `<${vid.tag} width="${vid.width}" height="${vid.height}" controls><source src="${vid.source}" type="${vid.type}" /></${vid.tag}>`;
		} else {
			embed.value = embed.value
				.replace(/src=".*?"/g, `src="${vid?.source}"`)
				.replace(/width=".*?"/g, `width="${vid?.width}"`)
				.replace(/height=".*?"/g, `height="${vid?.height}"`)
				.replace(/type=".*?"/g, `type="${vid?.type}"`)
				.replaceAll(/<(video|audio)/g, `<${vid?.tag}`)
				.replaceAll(/<\/(video|audio)/g, `</${vid?.tag}`);
		}
	});

	watch(embed, (newEmbed) => {
		if (newEmbed === '') {
			mediaSelection.value = null;
		} else {
			const tag = /<(video|audio)/g.exec(newEmbed)?.[1];
			const source = /src="(.*?)"/g.exec(newEmbed)?.[1] || undefined;
			const width = Number(/width="(.*?)"/g.exec(newEmbed)?.[1]) || undefined;
			const height = Number(/height="(.*?)"/g.exec(newEmbed)?.[1]) || undefined;
			const type = /type="(.*?)"/g.exec(newEmbed)?.[1] || undefined;

			if (source === undefined) return;

			mediaSelection.value = {
				tag: tag === 'audio' ? 'audio' : 'video',
				source,
				width,
				height,
				type,
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
		const url = getPublicURL() + 'assets/' + media.id;
		const tag = media.type.startsWith('audio') ? 'audio' : 'video';
		const source = imageToken.value ? addTokenToURL(url, imageToken.value) : url;

		mediaSelection.value = {
			source,
			width: media.width || 300,
			height: media.height || 150,
			tag,
			type: media.type,
		};
	}

	function saveMedia() {
		if (embed.value === '') return;

		isEditorDirty.value = true;
		if (startEmbed.value !== '') {
			const updatedContent = editor.value.getContent().replace(startEmbed.value, embed.value);
			editor.value.setContent(updatedContent);
		} else {
			editor.value.selection.setContent(embed.value);
		}
		closeMediaDrawer();
	}
}
