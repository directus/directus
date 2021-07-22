import { RuntimeException } from 'node-exceptions';

export class InvalidPayloadException extends RuntimeException {
	constructor(message = 'Invalid user payload') {
		super(message, 400, 'INVALID_PAYLOAD');
	}
}
