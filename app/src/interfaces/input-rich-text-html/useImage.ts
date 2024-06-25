import { i18n } from '@/lang';
import { addQueryToPath } from '@/utils/add-query-to-path';
import { getPublicURL } from '@/utils/get-root-path';
import { readableMimeType } from '@/utils/readable-mime-type';
import mime from 'mime/lite';
import { Ref, ref, watch } from 'vue';
import { SettingsStorageAssetPreset, File } from '@directus/types';

type ImageSelection = {
	imageUrl: string;
	alt: string;
	lazy?: boolean;
	width?: number | null;
	height?: number | null;
	transformationKey?: string | null;
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
	onImageSelect: (image: File) => void;
	saveImage: () => void;
	imageButton: ImageButton;
};

export default function useImage(
	editor: Ref<any>,
	imageToken: Ref<string | undefined>,
	options: {
		storageAssetTransform: Ref<string>;
		storageAssetPresets: Ref<SettingsStorageAssetPreset[]>;
	},
): UsableImage {
	const imageDrawerOpen = ref(false);
	const imageSelection = ref<ImageSelection | null>(null);
	const selectedPreset = ref<SettingsStorageAssetPreset | undefined>();

	watch(
		() => imageSelection.value?.transformationKey,
		(newKey) => {
			selectedPreset.value = options.storageAssetPresets.value.find(
				(preset: SettingsStorageAssetPreset) => preset.key === newKey,
			);

			if (selectedPreset.value) {
				imageSelection.value!.width = selectedPreset.value.width ?? undefined;
				imageSelection.value!.height = selectedPreset.value.height ?? undefined;
			}
		},
	);

	const imageButton = {
		icon: 'image',
		tooltip: i18n.global.t('wysiwyg_options.image'),
		onAction: (buttonApi: any) => {
			imageDrawerOpen.value = true;

			if (buttonApi === true || buttonApi.isActive()) {
				const node = editor.value.selection.getNode() as HTMLImageElement;
				const imageUrl = node.getAttribute('src');
				const imageUrlParams = imageUrl ? new URL(imageUrl).searchParams : undefined;
				const alt = node.getAttribute('alt');
				const lazy = node.getAttribute('loading') === 'lazy';
				const width = Number(imageUrlParams?.get('width') || undefined) || undefined;
				const height = Number(imageUrlParams?.get('height') || undefined) || undefined;
				const transformationKey = imageUrlParams?.get('key') || undefined;

				if (imageUrl === null || alt === null) {
					return;
				}

				if (transformationKey) {
					selectedPreset.value = options.storageAssetPresets.value.find(
						(preset: SettingsStorageAssetPreset) => preset.key === transformationKey,
					);
				}

				imageSelection.value = {
					imageUrl,
					alt,
					lazy,
					width: selectedPreset.value ? selectedPreset.value.width ?? undefined : width,
					height: selectedPreset.value ? selectedPreset.value.height ?? undefined : height,
					transformationKey,
					previewUrl: replaceUrlAccessToken(imageUrl, imageToken.value),
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

	function onImageSelect(image: File) {
		const fileExtension = image.type
			? readableMimeType(image.type, true)
			: readableMimeType(mime.getType(image.filename_download) as string, true);

		const assetUrl = getPublicURL() + 'assets/' + image.id + '.' + fileExtension;

		imageSelection.value = {
			imageUrl: replaceUrlAccessToken(assetUrl, imageToken.value),
			alt: image.title!,
			lazy: false,
			width: image.width,
			height: image.height,
			previewUrl: replaceUrlAccessToken(assetUrl, imageToken.value),
		};
	}

	function saveImage() {
		editor.value.fire('focus');

		const img = imageSelection.value;
		if (img === null) return;

		const queries: Record<string, any> = {};
		const newURL = new URL(img.imageUrl);

		newURL.searchParams.delete('width');
		newURL.searchParams.delete('height');
		newURL.searchParams.delete('key');

		if (options.storageAssetTransform.value === 'all') {
			if (img.transformationKey) {
				queries['key'] = img.transformationKey;
			} else {
				queries['width'] = img.width;
				queries['height'] = img.height;
			}
		} else if (options.storageAssetTransform.value === 'presets') {
			if (img.transformationKey) {
				queries['key'] = img.transformationKey;
			}
		}

		const resizedImageUrl = addQueryToPath(newURL.toString(), queries);
		const imageHtml = `<img src="${resizedImageUrl}" alt="${img.alt}" ${img.lazy ? 'loading="lazy" ' : ''}/>`;
		editor.value.selection.setContent(imageHtml);
		editor.value.undoManager.add();
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
