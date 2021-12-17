import { addTokenToURL } from '@/api';
import { i18n } from '@/lang';
import { addQueryToPath } from '@/utils/add-query-to-path';
import { getPublicURL } from '@/utils/get-root-path';
import { Ref, ref } from 'vue';
import { replaceUrlAccessToken } from '@/utils/replace-url-access-token';

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
				const imagePreviewUrl = node.getAttribute('src');
				const imageUrlParams = imagePreviewUrl ? new URL(imagePreviewUrl).searchParams : undefined;
				const alt = node.getAttribute('alt');
				const width = Number(imageUrlParams?.get('width') || undefined) || undefined;
				const height = Number(imageUrlParams?.get('height') || undefined) || undefined;

				if (imagePreviewUrl === null || alt === null) {
					return;
				}

				const imageUrl = replaceUrlAccessToken(imagePreviewUrl, null);

				imageSelection.value = {
					imageUrl,
					alt,
					width,
					height,
					previewUrl: imagePreviewUrl,
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
		const imageUrl = getPublicURL() + 'assets/' + image.id;

		imageSelection.value = {
			imageUrl,
			alt: image.title,
			width: image.width,
			height: image.height,
			previewUrl: addTokenToURL(imageUrl, imageToken.value),
		};
	}

	function saveImage() {
		const img = imageSelection.value;
		if (img === null) return;
		const resizedImageUrl = addTokenToURL(
			addQueryToPath(img.imageUrl, {
				...(img.width ? { width: img.width.toString() } : {}),
				...(img.height ? { height: img.height.toString() } : {}),
			})
		);
		const imageHtml = `<img src="${resizedImageUrl}" alt="${img.alt}" />`;
		isEditorDirty.value = true;
		editor.value.selection.setContent(imageHtml);
		closeImageDrawer();
	}
}
