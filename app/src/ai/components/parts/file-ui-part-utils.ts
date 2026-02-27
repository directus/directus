import type { File } from '@directus/types';
import type { FileUIPart } from 'ai';
import mime from 'mime/lite';

export function isImagePreview(part: FileUIPart): boolean {
	return !!part.mediaType?.startsWith('image/') && !!part.url;
}

export function toLightboxFile(part: FileUIPart): Pick<File, 'id' | 'title' | 'type' | 'modified_on' | 'width' | 'height'> {
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
