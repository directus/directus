import { BaseException } from './base';

export class InvalidIPException extends BaseException {
	constructor(message = 'Invalid IP address.') {
		super(message, 401, 'INVALID_IP');
	}
}
