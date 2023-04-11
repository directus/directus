import { BaseException } from '@directus/exceptions';

export class UserSuspendedException extends BaseException {
	constructor(message = 'User suspended.') {
		super(message, 401, 'USER_SUSPENDED');
	}
}
