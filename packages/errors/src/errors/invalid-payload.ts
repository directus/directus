import { fromZodError, isZodErrorLike, type ZodError } from 'zod-validation-error';
import { createError, type DirectusErrorConstructor, ErrorCode } from '../index.js';

export interface InvalidPayloadErrorExtensions {
	reason: string;
}

export const messageConstructor = ({ reason }: InvalidPayloadErrorExtensions) => `Invalid payload. ${reason}.`;

const BaseInvalidPayloadError: DirectusErrorConstructor<InvalidPayloadErrorExtensions> =
	createError<InvalidPayloadErrorExtensions>(ErrorCode.InvalidPayload, messageConstructor, 400);

export class InvalidPayloadError extends BaseInvalidPayloadError {
	constructor(extensions: InvalidPayloadErrorExtensions | ZodError, options?: ErrorOptions) {
		super(isZodErrorLike(extensions) ? { reason: fromZodError(extensions).message } : extensions, options);
	}
}
