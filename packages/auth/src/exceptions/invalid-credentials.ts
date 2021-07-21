import { RuntimeException } from 'node-exceptions';

export class InvalidCredentialsException extends RuntimeException {
	constructor(message = 'Invalid user credentials') {
		super(message, 401, 'INVALID_CREDENTIALS');
	}
}
