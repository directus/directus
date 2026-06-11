import type { File, SettingsStorageAssetPreset } from '@directus/types';
import type { Editor } from '@tiptap/vue-3';
import mime from 'mime/lite';
import { Ref, ref, watch } from 'vue';
import { addQueryToPath } from '@/utils/add-query-to-path';
import { getPublicURL } from '@/utils/get-root-path';
import { readableMimeType } from '@/utils/readable-mime-type';

type ImageSelection = {
	imageUrl: string;
	alt: string;
	lazy?: boolean;
	width?: number | null;
	height?: number | null;
	transformationKey?: string | null;
	previewUrl?: string;
};

type UsableImage = {
	imageDrawerOpen: Ref<boolean>;
	imageSelection: Ref<ImageSelection | null>;
	openImageDrawer: () => void;
	closeImageDrawer: () => void;
	onImageSelect: (image: File) => void;
	saveImage: () => void;
};

export default function useImage(
	editor: Ref<Editor | undefined>,
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

	return { imageDrawerOpen, imageSelection, openImageDrawer, closeImageDrawer, onImageSelect, saveImage };

	function openImageDrawer() {
		if (!editor.value) return;

		if (editor.value.isActive('image')) {
			const { src, alt, loading } = editor.value.getAttributes('image');
			const imageUrl = typeof src === 'string' ? src : null;
			const imageUrlParams = imageUrl ? new URL(imageUrl, 'file://').searchParams : undefined;
			const lazy = loading === 'lazy';
			const width = Number(imageUrlParams?.get('width') || undefined) || undefined;
			const height = Number(imageUrlParams?.get('height') || undefined) || undefined;
			const transformationKey = imageUrlParams?.get('key') || undefined;

			if (imageUrl === null) {
				imageSelection.value = null;
				imageDrawerOpen.value = true;
				return;
			}

			if (transformationKey) {
				selectedPreset.value = options.storageAssetPresets.value.find(
					(preset: SettingsStorageAssetPreset) => preset.key === transformationKey,
				);
			}

			imageSelection.value = {
				imageUrl,
				alt: alt ?? '',
				lazy,
				width: selectedPreset.value ? (selectedPreset.value.width ?? undefined) : width,
				height: selectedPreset.value ? (selectedPreset.value.height ?? undefined) : height,
				transformationKey,
				previewUrl: replaceUrlAccessToken(imageUrl, imageToken.value),
			};
		} else {
			imageSelection.value = null;
		}

		imageDrawerOpen.value = true;
	}

	function closeImageDrawer() {
		imageSelection.value = null;
		imageDrawerOpen.value = false;
	}

	function onImageSelect(image: File) {
		const filenameDiskExtension = image.filename_disk.includes('.') ? image.filename_disk.split('.').pop() : undefined;

		const fileTypeExtension = image.type
			? readableMimeType(image.type, true)
			: readableMimeType(mime.getType(image.filename_download) as string, true);

		const fileExtension = filenameDiskExtension ?? fileTypeExtension;

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
		const img = imageSelection.value;
		if (img === null || !editor.value) return;

		const queries: Record<string, any> = {};
		const newURL = new URL(img.imageUrl, 'file://');

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

		const resizedImageUrl = addQueryToPath(newURL.toString().replace('file://', ''), queries);

		editor.value
			.chain()
			.focus()
			.insertContent({
				type: 'image',
				attrs: {
					src: resizedImageUrl,
					alt: img.alt,
					loading: img.lazy ? 'lazy' : null,
				},
			})
			.run();

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
