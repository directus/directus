import { RuntimeException } from 'node-exceptions';

export class InvalidOperationException extends RuntimeException {
	constructor(message = 'Invalid operation') {
		super(message, 401, 'INVALID_OPERATION');
	}
}
