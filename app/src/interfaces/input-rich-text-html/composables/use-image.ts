import type { File, SettingsStorageAssetPreset } from '@directus/types';
import type { EditorState } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/vue-3';
import mime from 'mime/lite';
import { Ref, ref, watch } from 'vue';
import { FIGCAPTION_NODE, FIGURE_NODE, findFigure, getFigureCaption } from '../extensions/figure';
import {
	activeImageType,
	IMAGE_LINK_ATTRIBUTES,
	IMAGE_NODE,
	INLINE_IMAGE_NODE,
	isImageNode,
	withoutImageLink,
} from '../extensions/image';
import { replaceUrlAccessToken } from './replace-url-access-token';
import { addQueryToPath } from '@/utils/add-query-to-path';
import { getPublicURL } from '@/utils/get-root-path';
import { readableMimeType } from '@/utils/readable-mime-type';

export type ImageSelection = {
	imageUrl: string;
	alt: string;
	/** Non-empty wraps the image in `<figure>` with a `<figcaption>`; empty keeps/reverts to a bare `<img>`. */
	caption?: string;
	lazy?: boolean;
	width?: number;
	height?: number;
	transformationKey?: string | null;
	previewUrl?: string;
	/** Keeps the image in its line of text (`inlineImage`); a captioned image is always a block image. */
	inline?: boolean;
	/** The edited block image is a figure's image, so it cannot become inline. */
	inFigure?: boolean;
};

/** The drawer offers inline only for an image that is not a figure's image and has no caption. */
export function canBeInline(selection: ImageSelection): boolean {
	return !selection.inFigure && !selection.caption?.trim();
}

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
	/** Whether the drawer was prefilled from an existing image, so saving edits it instead of inserting. */
	const editingImage = ref(false);

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
		imageDrawerOpen.value = true;
		imageSelection.value = null;
		editingImage.value = false;

		const type = activeImageType(editor.value);
		if (type === null) return;

		const attrs = editor.value.getAttributes(type);
		const imageUrl = attrs.src ?? null;
		const alt = attrs.alt ?? null;

		if (imageUrl === null || alt === null) return;

		const imageUrlParams = safeUrlParams(imageUrl);
		// an inline image in a figure's paragraph is not the figure's image
		const figure = type === IMAGE_NODE ? findFigure(editor.value.state.selection) : undefined;
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
			caption: figure ? getFigureCaption(figure.node) : '',
			lazy,
			width: selectedPreset.value ? (selectedPreset.value.width ?? undefined) : width,
			height: selectedPreset.value ? (selectedPreset.value.height ?? undefined) : height,
			transformationKey,
			previewUrl: replaceUrlAccessToken(imageUrl, imageToken.value),
			inline: type === INLINE_IMAGE_NODE,
			inFigure: Boolean(figure),
		};

		editingImage.value = true;
	}

	function closeImageDrawer() {
		imageSelection.value = null;
		editingImage.value = false;
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
			caption: '',
			lazy: false,
			width: image.width ?? undefined,
			height: image.height ?? undefined,
			previewUrl: replaceUrlAccessToken(assetUrl, imageToken.value),
			inline: false,
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

		const inline = Boolean(img.inline) && !img.inFigure;
		const caption = inline ? '' : (img.caption?.trim() ?? '');
		// insert-vs-edit is decided when the drawer opens, so saving does what the form showed the user;
		// re-resolving the position here keeps it valid if the doc was re-synced while the drawer was open
		const imagePos = editingImage.value ? findImagePos(editor.value.state) : undefined;
		const existingImage = imagePos === undefined ? null : editor.value.state.doc.nodeAt(imagePos);
		const chain = editor.value.chain().focus();

		if (imagePos === undefined || !existingImage) {
			// fresh insert: with a caption the whole figure goes in at once, so there is no intermediate
			// state where a wrap could catch the wrong block
			if (inline) {
				chain.insertContent({ type: INLINE_IMAGE_NODE, attrs });
			} else if (caption) {
				chain.insertContent(captionedFigure(attrs, caption));
			} else {
				chain.setImage(attrs);
			}
		} else if (existingImage.type.name === INLINE_IMAGE_NODE && !inline) {
			const link = existingImage.marks.find((mark) => mark.type.name === 'link')?.attrs;
			// a block image's link tooltip is its own title, so the mark's title moves onto the image
			const title = existingImage.attrs.title ?? link?.title ?? null;
			const blockAttrs = { ...existingImage.attrs, ...linkAttributes(link), title, ...attrs };

			chain
				.setNodeSelection(imagePos)
				.insertContent(caption ? captionedFigure(blockAttrs, caption) : { type: IMAGE_NODE, attrs: blockAttrs });
		} else if (existingImage.type.name === IMAGE_NODE && inline) {
			const blockAttrs: Record<string, unknown> = { ...existingImage.attrs, ...attrs };
			const inlineAttrs = withoutImageLink(blockAttrs);
			const marks = blockAttrs.href ? [{ type: 'link', attrs: linkAttributes(blockAttrs) }] : [];

			chain
				.setNodeSelection(imagePos)
				.insertContent({ type: 'paragraph', content: [{ type: INLINE_IMAGE_NODE, attrs: inlineAttrs, marks }] });
		} else {
			// editing an existing image: update in place rather than replacing the node, so its own
			// preserved attributes (class/id/data-*) and any surrounding figure survive the edit
			chain.setNodeSelection(imagePos).updateAttributes(existingImage.type.name, attrs);

			if (existingImage.type.name === IMAGE_NODE) {
				if (caption) chain.setFigureCaption(caption);
				else chain.unsetFigureCaption();
			}
		}

		chain.run();

		closeImageDrawer();
	}

	/** Position of the first image overlapping the selection, or `undefined` when there is none. */
	function findImagePos(state: EditorState): number | undefined {
		const { from, to } = state.selection;
		let imagePos: number | undefined;

		state.doc.nodesBetween(from, to, (node, pos) => {
			if (imagePos === undefined && isImageNode(node)) imagePos = pos;
		});

		return imagePos;
	}

	function captionedFigure(attrs: Record<string, unknown>, caption: string) {
		return {
			type: FIGURE_NODE,
			content: [
				{ type: IMAGE_NODE, attrs },
				{ type: FIGCAPTION_NODE, content: [{ type: 'text', text: caption }] },
			],
		};
	}

	function linkAttributes(attrs: Record<string, unknown> | undefined) {
		return Object.fromEntries(IMAGE_LINK_ATTRIBUTES.map((name) => [name, attrs?.[name] ?? null]));
	}

	function safeUrlParams(url: string): URLSearchParams | undefined {
		try {
			return new URL(url, 'file://').searchParams;
		} catch {
			return undefined;
		}
	}
}
