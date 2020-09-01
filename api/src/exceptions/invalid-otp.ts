import { BaseException } from './base';

export class InvalidOTPException extends BaseException {
	constructor(message = 'Invalid user OTP.') {
		super(message, 401, 'INVALID_OTP');
	}
}
