import { createError, ErrorCode } from '../index.js';

export interface UnprocessableContentErrorExtensions {
	reason: string;
}

const messageConstructor = (extensions: UnprocessableContentErrorExtensions) =>
	`Can't process content. ${extensions.reason}.`;

export const UnprocessableContentError = createError<UnprocessableContentErrorExtensions>(
	ErrorCode.UnprocessableContent,
	messageConstructor,
	422,
);
