import { createError } from '@directus/errors';

interface UnprocessableContentErrorExtensions {
	reason: string;
}

const messageConstructor = (extensions: UnprocessableContentErrorExtensions) =>
	`Can't process content. ${extensions.reason}.`;

export const UnprocessableContentError = createError<UnprocessableContentErrorExtensions>(
	'UNPROCESSABLE_CONTENT',
	messageConstructor,
	422
);
