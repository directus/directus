import { BaseException } from '@directus/shared/exceptions';

export class AuthenticationFailedException extends BaseException {
	constructor(message = 'Authentication failed.') {
		super(message, 401, 'AUTH_FAILED');
	}
}
