import { addTokenToURL } from '@/api';
import { i18n } from '@/lang';
import { getPublicURL } from '@/utils/get-root-path';
import { Ref, ref } from 'vue';

type ImageSelection = {
	imageUrl: string;
	alt: string;
	width?: number;
	height?: number;
	previewUrl?: string;
};

type ImageButton = {
	icon: string;
	tooltip: string;
	onAction: (buttonApi: any) => void;
	onSetup: (buttonApi: any) => () => void;
};

type UsableImage = {
	imageDrawerOpen: Ref<boolean>;
	imageSelection: Ref<ImageSelection | null>;
	closeImageDrawer: () => void;
	onImageSelect: (image: Record<string, any>) => void;
	saveImage: () => void;
	imageButton: ImageButton;
};

export default function useImage(
	editor: Ref<any>,
	isEditorDirty: Ref<boolean>,
	imageToken: Ref<string | undefined>
): UsableImage {
	const imageDrawerOpen = ref(false);
	const imageSelection = ref<ImageSelection | null>(null);

	const imageButton = {
		icon: 'image',
		tooltip: i18n.global.t('wysiwyg_options.image'),
		onAction: (buttonApi: any) => {
			imageDrawerOpen.value = true;

			if (buttonApi.isActive()) {
				const node = editor.value.selection.getNode() as HTMLImageElement;
				const imageUrl = node.getAttribute('src');
				const alt = node.getAttribute('alt');

				if (imageUrl === null || alt === null) {
					return;
				}

				imageSelection.value = {
					imageUrl,
					alt,
					width: Number(node.getAttribute('width')) || undefined,
					height: Number(node.getAttribute('height')) || undefined,
					previewUrl: imageUrl,
				};
			} else {
				imageSelection.value = null;
			}
		},
		onSetup: (buttonApi: any) => {
			const onImageNodeSelect = (eventApi: any) => {
				buttonApi.setActive(eventApi.element.tagName === 'IMG');
			};

			editor.value.on('NodeChange', onImageNodeSelect);

			return function () {
				editor.value.off('NodeChange', onImageNodeSelect);
			};
		},
	};

	return { imageDrawerOpen, imageSelection, closeImageDrawer, onImageSelect, saveImage, imageButton };

	function closeImageDrawer() {
		imageSelection.value = null;
		imageDrawerOpen.value = false;
	}

	function onImageSelect(image: Record<string, any>) {
		const imageUrl = addTokenToURL(getPublicURL() + 'assets/' + image.id, imageToken.value);

		imageSelection.value = {
			imageUrl,
			alt: image.title,
			width: image.width,
			height: image.height,
			previewUrl: imageUrl,
		};
	}

	function saveImage() {
		const img = imageSelection.value;
		if (img === null) return;
		const imageHtml = `<img src="${img.imageUrl}" alt="${img.alt}" width="${img.width}" height="${img.height}" />`;
		isEditorDirty.value = true;
		editor.value.selection.setContent(imageHtml);
		closeImageDrawer();
	}
}
