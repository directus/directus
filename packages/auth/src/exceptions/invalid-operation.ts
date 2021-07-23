import { BaseException } from '@directus/shared/exceptions';

export class InvalidOperationException extends BaseException {
	constructor(message = 'Invalid operation') {
		super(message, 401, 'INVALID_OPERATION');
	}
}
