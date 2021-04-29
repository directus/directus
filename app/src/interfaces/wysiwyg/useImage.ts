import { Ref, ref } from '@vue/composition-api';
import { getPublicURL } from '@/utils/get-root-path';
import { addTokenToURL } from '@/api';
import i18n from '@/lang';

type ImageSelection = {
	imageUrl: string;
	alt: string;
	width?: number;
	height?: number;
};

export default function useImage(editor: Ref<any>, imageToken: Ref<string>): Record<string, any> {
	const imageDrawerOpen = ref(false);
	const imageSelection = ref<ImageSelection | null>(null);

	const imageButton = {
		icon: 'image',
		tooltip: i18n.t('wysiwyg_options.image'),
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

			return function (buttonApi: any) {
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
		let imageUrl = getPublicURL() + 'assets/' + image.id;

		if (imageToken.value) {
			imageUrl = addTokenToURL(imageUrl, imageToken.value);
		}

		imageSelection.value = {
			imageUrl,
			alt: image.title,
			width: image.width,
			height: image.height,
		};
	}

	function saveImage() {
		const img = imageSelection.value;
		if (img === null) return;
		const imageHtml = `<img src="${img.imageUrl}" alt="${img.alt}" width="${img.width}" height="${img.height}" />`;
		editor.value.selection.setContent(imageHtml);
		closeImageDrawer();
	}
}
