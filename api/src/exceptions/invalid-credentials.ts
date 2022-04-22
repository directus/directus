import { BaseException } from '@directus/shared/exceptions';

export class InvalidCredentialsException extends BaseException {
	constructor(message = 'Invalid user credentials.') {
		super(message, 401, 'INVALID_CREDENTIALS');
	}
}
