import type { File } from '@directus/types';
import type { FileUIPart } from 'ai';
import mime from 'mime/lite';
import { isFileContext, isLocalFileContext, type PendingContextItem } from '../../types';
import { getAssetUrl } from '@/utils/get-asset-url';

export function isImagePreview(part: FileUIPart): boolean {
	return !!part.mediaType?.startsWith('image/') && !!part.url;
}

export function toLightboxFile(
	part: FileUIPart,
): Pick<File, 'id' | 'title' | 'type' | 'modified_on' | 'width' | 'height'> {
	return {
		id: '',
		title: part.filename || '',
		type: part.mediaType || 'application/octet-stream',
		modified_on: new Date().toISOString(),
		width: 0,
		height: 0,
	};
}

export function fileExtension(mediaType: string | undefined): string {
	return mime.getExtension(mediaType ?? '') || 'file';
}

export function isImageFile(item: PendingContextItem): boolean {
	if (isLocalFileContext(item)) {
		return item.data.file.type.startsWith('image/');
	}

	if (isFileContext(item)) {
		return item.data.type?.startsWith('image/') ?? false;
	}

	return false;
}

export function getImageUrl(item: PendingContextItem): string | undefined {
	if (!isImageFile(item)) return undefined;

	if (isLocalFileContext(item)) {
		return item.data.thumbnailUrl;
	}

	if (isFileContext(item)) {
		if (item.data.type?.includes('svg')) {
			return getAssetUrl(item.data.id);
		}

		return getAssetUrl(item.data.id, { key: 'system-small-cover' });
	}

	return undefined;
}
