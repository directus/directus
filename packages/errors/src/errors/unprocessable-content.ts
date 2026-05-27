import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface UnprocessableContentErrorExtensions {
	reason: string;
}

const messageConstructor = (extensions: UnprocessableContentErrorExtensions) =>
	`Can't process content. ${extensions.reason}.`;

export const UnprocessableContentError: DirectusErrorConstructor<UnprocessableContentErrorExtensions> =
	createError<UnprocessableContentErrorExtensions>(ErrorCode.UnprocessableContent, messageConstructor, 422);
