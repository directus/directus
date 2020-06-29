import { BaseException } from './base';

export class InvalidPayloadException extends BaseException {
	constructor(message: string) {
		super(message, 400, 'INVALID_PAYLOAD');
	}
}
