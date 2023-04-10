import { BaseException } from '@directus/exceptions';

export class InvalidTokenException extends BaseException {
	constructor(message = 'Invalid token') {
		super(message, 403, 'INVALID_TOKEN');
	}
}
