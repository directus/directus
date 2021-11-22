import { BaseException } from '@directus/shared/exceptions';

export class InvalidPayloadException extends BaseException {
	constructor(message: string, extensions?: Record<string, unknown>) {
		super(message, 400, 'INVALID_PAYLOAD', extensions);
	}
}
