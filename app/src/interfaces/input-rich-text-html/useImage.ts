import { getToken } from '@/api';
import { i18n } from '@/lang';
import { addQueryToPath } from '@/utils/add-query-to-path';
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

export default function useImage(editor: Ref<any>, imageToken: Ref<string | undefined>): UsableImage {
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
				const imageUrlParams = imageUrl ? new URL(imageUrl).searchParams : undefined;
				const alt = node.getAttribute('alt');
				const width = Number(imageUrlParams?.get('width') || undefined) || undefined;
				const height = Number(imageUrlParams?.get('height') || undefined) || undefined;

				if (imageUrl === null || alt === null) {
					return;
				}

				imageSelection.value = {
					imageUrl,
					alt,
					width,
					height,
					previewUrl: replaceUrlAccessToken(imageUrl, imageToken.value ?? getToken()),
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
		const assetUrl = getPublicURL() + 'assets/' + image.id;

		imageSelection.value = {
			imageUrl: replaceUrlAccessToken(assetUrl, imageToken.value),
			alt: image.title,
			width: image.width,
			height: image.height,
			previewUrl: replaceUrlAccessToken(assetUrl, imageToken.value ?? getToken()),
		};
	}

	function saveImage() {
		const img = imageSelection.value;
		if (img === null) return;
		const resizedImageUrl = addQueryToPath(img.imageUrl, {
			...(img.width ? { width: img.width.toString() } : {}),
			...(img.height ? { height: img.height.toString() } : {}),
		});
		const imageHtml = `<img src="${resizedImageUrl}" alt="${img.alt}" />`;
		editor.value.selection.setContent(imageHtml);
		closeImageDrawer();
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
