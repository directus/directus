import type { File, SettingsStorageAssetPreset } from '@directus/types';
import type { Editor } from '@tiptap/vue-3';
import mime from 'mime/lite';
import { Ref, ref, watch } from 'vue';
import { replaceUrlAccessToken } from './replace-url-access-token';
import { addQueryToPath } from '@/utils/add-query-to-path';
import { getPublicURL } from '@/utils/get-root-path';
import { readableMimeType } from '@/utils/readable-mime-type';

export type ImageSelection = {
	imageUrl: string;
	alt: string;
	lazy?: boolean;
	width?: number;
	height?: number;
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

export function useImage(
	editor: Ref<Editor>,
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

	// Opens the drawer; when an image node is selected, prefill the form from its attributes for editing.
	function openImageDrawer() {
		imageDrawerOpen.value = true;

		if (!editor.value.isActive('image')) {
			imageSelection.value = null;
			return;
		}

		const attrs = editor.value.getAttributes('image');
		const imageUrl = attrs.src ?? null;
		const alt = attrs.alt ?? null;

		if (imageUrl === null || alt === null) {
			imageSelection.value = null;
			return;
		}

		const imageUrlParams = safeUrlParams(imageUrl);
		const lazy = attrs.loading === 'lazy';
		const width = Number(imageUrlParams?.get('width') || undefined) || undefined;
		const height = Number(imageUrlParams?.get('height') || undefined) || undefined;
		const transformationKey = imageUrlParams?.get('key') || undefined;

		if (transformationKey) {
			selectedPreset.value = options.storageAssetPresets.value.find(
				(preset: SettingsStorageAssetPreset) => preset.key === transformationKey,
			);
		}

		imageSelection.value = {
			imageUrl,
			alt,
			lazy,
			width: selectedPreset.value ? (selectedPreset.value.width ?? undefined) : width,
			height: selectedPreset.value ? (selectedPreset.value.height ?? undefined) : height,
			transformationKey,
			previewUrl: replaceUrlAccessToken(imageUrl, imageToken.value),
		};
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
			width: image.width ?? undefined,
			height: image.height ?? undefined,
			previewUrl: replaceUrlAccessToken(assetUrl, imageToken.value),
		};
	}

	function saveImage() {
		const img = imageSelection.value;
		if (img === null) return;

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

		// `loading` is added by the extended Image node (extensions/image.ts), beyond SetImageOptions' base type
		const attrs = { src: resizedImageUrl, alt: img.alt, loading: img.lazy ? 'lazy' : null };

		editor.value.chain().focus().setImage(attrs).run();

		closeImageDrawer();
	}

	function safeUrlParams(url: string): URLSearchParams | undefined {
		try {
			return new URL(url, 'file://').searchParams;
		} catch {
			return undefined;
		}
	}
}
