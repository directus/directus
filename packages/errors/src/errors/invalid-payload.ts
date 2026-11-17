import { createError, ErrorCode, withZodSupport, type ZodAwareErrorConstructor } from '../index.js';

export interface InvalidPayloadErrorExtensions {
	reason: string;
}

export const messageConstructor = ({ reason }: InvalidPayloadErrorExtensions) => `Invalid payload. ${reason}.`;

export const InvalidPayloadError: ZodAwareErrorConstructor<InvalidPayloadErrorExtensions> = withZodSupport(
	createError<InvalidPayloadErrorExtensions>(ErrorCode.InvalidPayload, messageConstructor, 400),
);
