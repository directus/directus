import { computed, Ref, ref, watch } from '@vue/composition-api';
import { getPublicURL } from '@/utils/get-root-path';
import { addTokenToURL } from '@/api';
import i18n from '@/lang';

type MediaSelection = {
	source: string;
	width?: number;
	height?: number;
};

export default function useMedia(editor: Ref<any>, imageToken: Ref<string>) {
	const mediaDrawerOpen = ref(false);
	const mediaSelection = ref<MediaSelection | null>(null);
	const openMediaTab = ref(['video']);
	const embed = ref('');
	const startEmbed = ref('');

	const mediaButton = {
		icon: 'embed',
		tooltip: i18n.t('wysiwyg_options.media'),
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

			return function (buttonApi: any) {
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
			embed.value = `<video width="${vid.width}" height="${vid.height}" controls="controls"><source src="${vid.source}" /></video>`;
		} else {
			embed.value = embed.value
				.replace(/src=".*?"/g, `src="${vid?.source}"`)
				.replace(/width=".*?"/g, `width="${vid?.width}"`)
				.replace(/height=".*?"/g, `height="${vid?.height}"`);
		}
	});

	watch(embed, (newEmbed) => {
		if (newEmbed === '') {
			mediaSelection.value = null;
		} else {
			const source = /src="(.*?)"/g.exec(newEmbed)?.[1] || undefined;
			const width = Number(/width="(.*?)"/g.exec(newEmbed)?.[1]) || undefined;
			const height = Number(/height="(.*?)"/g.exec(newEmbed)?.[1]) || undefined;

			if (source === undefined) return;

			mediaSelection.value = {
				source,
				width,
				height,
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
		const source = addTokenToURL(getPublicURL() + 'assets/' + media.id, imageToken.value);

		mediaSelection.value = {
			source,
			width: media.width || 300,
			height: media.height || 150,
		};
	}

	function saveMedia() {
		if (embed.value === '') return;

		if (startEmbed.value !== '') {
			const updatedContent = editor.value.getContent().replace(startEmbed.value, embed.value);
			editor.value.setContent(updatedContent);
		} else {
			editor.value.selection.setContent(embed.value);
		}
		closeMediaDrawer();
	}
}
