import { createError, ErrorCode } from '../index.js';

// TODO should we have this natively support a ZodError for ease of use? `new InvalidPayloadError(ZodError)`
export interface InvalidPayloadErrorExtensions {
	reason: string;
}

export const messageConstructor = ({ reason }: InvalidPayloadErrorExtensions) => `Invalid payload. ${reason}.`;

export const InvalidPayloadError = createError<InvalidPayloadErrorExtensions>(
	ErrorCode.InvalidPayload,
	messageConstructor,
	400,
);
