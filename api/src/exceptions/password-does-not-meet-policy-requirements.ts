import { BaseException } from '@directus/shared/exceptions';

export class PasswordPolicyValidationException extends BaseException {
	constructor(message: string) {
		super(message, 401, 'PASSWORD_POLICY_VALIDATION_ERROR');
	}
}
