import { createError, ErrorCode } from '../index.js';

export interface InvalidPayloadErrorExtensions {
	reason: string;
}

export const messageConstructor = ({ reason }: InvalidPayloadErrorExtensions) => `Invalid payload. ${reason}.`;

export const InvalidPayloadError = createError<InvalidPayloadErrorExtensions>(
	ErrorCode.InvalidPayload,
	messageConstructor,
	400,
);
