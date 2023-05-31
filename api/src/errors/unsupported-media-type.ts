import { createError } from '@directus/errors';

export interface UnsupportedMediaTypeErrorExtensions {
	mediaType: string;
	where: string;
}

export const messageConstructor = (extensions: UnsupportedMediaTypeErrorExtensions) =>
	`Unsupported media type "${extensions.mediaType}" in ${extensions.where}.`;

export const UnsupportedMediaTypeError = createError<UnsupportedMediaTypeErrorExtensions>(
	'UNSUPPORTED_MEDIA_TYPE',
	messageConstructor,
	415
);
